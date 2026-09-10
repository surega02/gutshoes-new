<?php

namespace App\Console\Commands;

use App\Domain\Payment\ConfirmPayment;
use App\Domain\Payment\HttpMidtransProvider;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
            $result = DB::transaction(function (): string {
                $order = Order::where('order_number', $this->argument('order'))->lockForUpdate()->firstOrFail();
                $payment = Payment::where('order_id', $order->id)->where('provider', 'MIDTRANS')->lockForUpdate()->firstOrFail();
                if ($payment->paid_at) {
                    return 'Pembayaran sudah tercatat.';
                }
                $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')->acceptJson()->timeout(10)
                    ->get('https://api.sandbox.midtrans.com/v2/'.rawurlencode($order->order_number).'/status');
                $notFound = $response->status() === 404 || ($response->successful() && (string) $response->json('status_code') === '404');
                if ($notFound) {
                    if ($payment->snap_token) {
                        return 'Token sudah tersedia; gunakan tautan pembayaran yang tersimpan.';
                    }
                    if ($order->getRawOriginal('status') !== 'PENDING_PAYMENT' || Carbon::parse($order->expires_at)->isPast()) {
                        throw new RuntimeException('Order ditutup/kedaluwarsa; butuh review provider. Stok tetap ditahan.');
                    }
                    if ($payment->updated_at && $payment->updated_at->gt(now()->subMinutes(2))) {
                        throw new RuntimeException('Tunggu dua menit agar inisialisasi sebelumnya selesai.');
                    }
                    // Snap permits re-creation for the same uncharged order ID, invalidating the old token.
                    $snap = app(HttpMidtransProvider::class)->createSnapTransaction($order);
                    $payment->update(['snap_token' => $snap['token'], 'redirect_url' => $snap['redirect_url'], 'initialization_state' => 'ready']);

                    return 'Token dipulihkan pada order yang sama. Buka kembali pembayaran melalui aplikasi.';
                }
                $response->throw();
                $payload = $response->json();
                if (! is_array($payload)) {
                    throw new RuntimeException('Respons provider tidak valid.');
                }
                app(ConfirmPayment::class)->validate($order, $payment, $payload);
                if (($payload['transaction_status'] ?? '') === 'settlement' || (($payload['transaction_status'] ?? '') === 'capture' && ($payload['fraud_status'] ?? '') === 'accept')) {
                    app(ConfirmPayment::class)->apply($order, $payment, $payload);

                    return 'Pembayaran direkonsiliasi; periksa status order/refund di aplikasi.';
                }

                return 'Provider menemukan transaksi. Token tidak dibuat ulang; lanjutkan pembayaran yang ada atau review status di dashboard sandbox.';
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
