<?php

namespace App\Domain\Payment;

use App\Models\Order;

class FakeMidtransProvider implements MidtransProvider
{
    public function createSnapTransaction(Order $order): array
    {
        $token = 'fake-snap-'.hash('sha256', $order->order_number);

        return ['token' => $token, 'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/'.$token, 'transaction_id' => null];
    }

    public function closeTransaction(Order $order, string $action): array
    {
        return ['order_id' => $order->order_number, 'transaction_status' => $action,
            'transaction_id' => $order->payment->provider_transaction_id ?? 'fake-'.$order->id,
            'gross_amount' => (string) $order->grand_total];
    }

    public function getStatus(Order $order): ?array
    {
        $payment = $order->payment;
        if (! $payment?->provider_status) {
            return null;
        }

        return [
            'order_id' => $order->order_number,
            'transaction_id' => $payment->provider_transaction_id ?? 'fake-'.$order->id,
            'transaction_status' => $payment->provider_status,
            'gross_amount' => (string) $order->grand_total,
            'currency' => $order->currency,
        ];
    }

    public function verifyWebhook(array $payload): bool
    {
        $expected = hash('sha512', ($payload['order_id'] ?? '').($payload['status_code'] ?? '').($payload['gross_amount'] ?? '').config('services.midtrans.server_key'));

        return isset($payload['signature_key']) && is_string($payload['signature_key']) && hash_equals($expected, $payload['signature_key']);
    }
}
