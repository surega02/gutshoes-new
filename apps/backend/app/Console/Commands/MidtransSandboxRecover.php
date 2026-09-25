<?php

namespace App\Console\Commands;

use App\Domain\Payment\HttpMidtransProvider;
use App\Domain\Payment\ReconcileMidtransPayment;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MidtransSandboxRecover extends Command
{
    protected $signature = 'midtrans:sandbox-recover {order : Nomor order yang akan diperiksa}';

    protected $description = 'Rekonsiliasi satu intent sandbox; tidak pernah membuat order ID baru';

    public function handle(): int
    {
        if ($this->call('midtrans:sandbox-check') !== self::SUCCESS) {
            return self::FAILURE;
        }
        try {
            $order = Order::where('order_number', $this->argument('order'))->firstOrFail();
            Payment::where('order_id', $order->id)->where('provider', 'MIDTRANS')->firstOrFail();

            $reconciled = app(ReconcileMidtransPayment::class)->reconcile($order);
            if ($reconciled !== null) {
                $message = match ($reconciled->status) {
                    'SUCCESS' => 'Pembayaran direkonsiliasi; periksa status order/refund di aplikasi.',
                    'FAILED' => 'Status gagal dari provider direkonsiliasi; periksa status order dan provider di aplikasi.',
                    default => 'Transaksi masih pending di provider; token tidak dibuat ulang.',
                };
                $this->info($message);

                return self::SUCCESS;
            }

            $result = DB::transaction(function () use ($order): string {
                $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                $payment = Payment::where('order_id', $lockedOrder->id)->where('provider', 'MIDTRANS')->lockForUpdate()->firstOrFail();
                if ($payment->paid_at) {
                    return 'Pembayaran sudah tercatat.';
                }
                if ($payment->snap_token) {
                    return 'Token sudah tersedia; gunakan tautan pembayaran yang tersimpan.';
                }
                if ($lockedOrder->getRawOriginal('status') !== 'PENDING_PAYMENT' || Carbon::parse($lockedOrder->expires_at)->isPast()) {
                    throw new RuntimeException('Order ditutup/kedaluwarsa; butuh review provider. Stok tetap ditahan.');
                }
                if ($payment->updated_at && $payment->updated_at->gt(now()->subMinutes(2))) {
                    throw new RuntimeException('Tunggu dua menit agar inisialisasi sebelumnya selesai.');
                }
                // Snap permits re-creation for the same uncharged order ID, invalidating the old token.
                $snap = app(HttpMidtransProvider::class)->createSnapTransaction($lockedOrder);
                $payment->update(['snap_token' => $snap['token'], 'redirect_url' => $snap['redirect_url'], 'initialization_state' => 'ready']);

                return 'Token dipulihkan pada order yang sama. Buka kembali pembayaran melalui aplikasi.';
            });
            $this->info($result);

            return self::SUCCESS;
        } catch (\Throwable $error) {
            // HTTP exceptions may include provider response data. Do not print credentials or payment payloads.
            $this->error('Pemulihan belum berhasil ('.class_basename($error).'). Tidak ada stok dilepas. Periksa konfigurasi, umur intent, deadline, dan dashboard sandbox.');

            return self::FAILURE;
        }
    }
}
