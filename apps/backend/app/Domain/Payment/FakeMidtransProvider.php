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

    public function verifyWebhook(array $payload): bool
    {
        $expected = hash('sha512', ($payload['order_id'] ?? '').($payload['status_code'] ?? '').($payload['gross_amount'] ?? '').config('services.midtrans.server_key'));

        return isset($payload['signature_key']) && is_string($payload['signature_key']) && hash_equals($expected, $payload['signature_key']);
    }
}
