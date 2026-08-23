<?php

namespace App\Domain\Payment;

use App\Models\Order;
use App\Models\Payment;
use DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CreatePaymentService
{
    public function __construct(private readonly MidtransProvider $provider) {}

    /** @return array{payment:Payment,redirect_url:string} */
    public function create(Order $order): array
    {
        if ($order->getRawOriginal('status') !== 'PENDING_PAYMENT' || Carbon::parse($order->expires_at)->isPast()) {
            throw new DomainException('Order is no longer payable.');
        }

        return DB::transaction(function () use ($order): array {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $existing = Payment::where('order_id', $order->id)->where('provider', 'MIDTRANS')->lockForUpdate()->first();
            if ($existing?->snap_token) {
                return ['payment' => $existing, 'redirect_url' => $this->redirectUrl($existing->snap_token)];
            }
            $snap = $this->provider->createSnapTransaction($order);
            $payment = Payment::updateOrCreate(['order_id' => $order->id, 'provider' => 'MIDTRANS'], [
                'provider_transaction_id' => $snap['transaction_id'], 'snap_token' => $snap['token'], 'status' => 'PENDING',
                'amount' => $order->grand_total, 'currency' => $order->currency, 'expires_at' => $order->expires_at,
            ]);

            return ['payment' => $payment, 'redirect_url' => $snap['redirect_url']];
        }, 3);
    }

    private function redirectUrl(string $token): string
    {
        return rtrim((string) config('services.midtrans.redirect_base_url'), '/').'/'.$token;
    }
}
