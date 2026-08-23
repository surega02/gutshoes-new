<?php

namespace App\Domain\Payment;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class HttpMidtransProvider implements MidtransProvider
{
    public function createSnapTransaction(Order $order): array
    {
        $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')
            ->timeout(10)->retry(2, 250)->post(config('services.midtrans.snap_url'), [
                'transaction_details' => ['order_id' => $order->order_number, 'gross_amount' => (int) $order->grand_total],
                'customer_details' => ['first_name' => $order->customer_name, 'email' => $order->customer_email, 'phone' => $order->customer_phone],
                'expiry' => ['start_time' => now()->format('Y-m-d H:i:s O'), 'unit' => 'hours', 'duration' => 24],
            ])->throw()->json();
        if (! is_array($response) || ! isset($response['token'], $response['redirect_url'])) {
            throw new RuntimeException('Invalid Midtrans Snap response.');
        }

        return ['token' => (string) $response['token'], 'redirect_url' => (string) $response['redirect_url'], 'transaction_id' => null];
    }

    public function verifyWebhook(array $payload): bool
    {
        $expected = hash('sha512', ($payload['order_id'] ?? '').($payload['status_code'] ?? '').($payload['gross_amount'] ?? '').config('services.midtrans.server_key'));

        return isset($payload['signature_key']) && is_string($payload['signature_key']) && hash_equals($expected, $payload['signature_key']);
    }
}
