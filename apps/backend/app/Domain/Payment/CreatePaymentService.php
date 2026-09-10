<?php

namespace App\Domain\Payment;

use App\Models\Order;
use App\Models\Payment;
use DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class CreatePaymentService
{
    public function __construct(private readonly MidtransProvider $provider) {}

    /** @return array{payment:Payment,redirect_url:string} */
    public function create(Order $order): array
    {
        // Commit intent before network I/O. A concurrent request cannot create a second token.
        [$payment, $initialize] = DB::transaction(function () use ($order): array {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($locked->getRawOriginal('status') !== 'PENDING_PAYMENT' || Carbon::parse($locked->expires_at)->isPast()) {
                throw new DomainException('Order is no longer payable.');
            }
            $existing = Payment::where('order_id', $locked->id)->where('provider', 'MIDTRANS')->lockForUpdate()->first();
            if ($existing) {
                if ($existing->paid_at || $existing->status !== 'PENDING') {
                    throw new DomainException('Payment is no longer pending.');
                }
                if (! $existing->snap_token) {
                    throw ValidationException::withMessages(['payment' => ['Status pembayaran masih diperiksa. Jangan membuat pesanan baru; periksa kembali status pesanan atau hubungi dukungan.']]);
                }

                return [$existing, false];
            }

            return [Payment::create(['order_id' => $locked->id, 'provider' => 'MIDTRANS',
                'status' => 'PENDING', 'amount' => $locked->grand_total, 'currency' => $locked->currency,
                'expires_at' => $locked->expires_at, 'initialization_state' => 'creating']), true];
        }, 3);
        if ($initialize) {
            try {
                $snap = $this->provider->createSnapTransaction($order->refresh());
                $payment->update(['snap_token' => $snap['token'], 'redirect_url' => $snap['redirect_url'],
                    'initialization_state' => 'ready']);
            } catch (Throwable $error) {
                $payment->update(['initialization_state' => 'uncertain']);
                throw $error;
            }
        }
        $payment->refresh();
        $order->refresh();
        if ($order->getRawOriginal('status') !== 'PENDING_PAYMENT' || Carbon::parse($order->expires_at)->isPast()) {
            throw new DomainException('Order is no longer payable.');
        }

        return ['payment' => $payment, 'redirect_url' => $payment->redirect_url
            ?: rtrim((string) config('services.midtrans.redirect_base_url'), '/').'/'.$payment->snap_token];
    }
}
