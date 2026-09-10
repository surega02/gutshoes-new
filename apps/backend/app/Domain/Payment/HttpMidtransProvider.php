<?php

namespace App\Domain\Payment;

use App\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class HttpMidtransProvider implements MidtransProvider
{
    public function createSnapTransaction(Order $order): array
    {
        $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')
            ->timeout(10)->post(config('services.midtrans.snap_url'), [
                'transaction_details' => ['order_id' => $order->order_number, 'gross_amount' => (int) $order->grand_total],
                'customer_details' => ['first_name' => $order->customer_name, 'email' => $order->customer_email, 'phone' => $order->customer_phone],
                'expiry' => ['start_time' => Carbon::parse($order->expires_at)->subHours(24)->format('Y-m-d H:i:s O'), 'unit' => 'hours', 'duration' => 24],
            ])->throw()->json();
        if (! is_array($response) || ! isset($response['token'], $response['redirect_url'])) {
            throw new RuntimeException('Invalid Midtrans Snap response.');
        }

        return ['token' => (string) $response['token'], 'redirect_url' => (string) $response['redirect_url'], 'transaction_id' => null];
    }

    public function closeTransaction(Order $order, string $action): array
    {
        if (! in_array($action, ['cancel', 'expire'], true)) {
            throw new RuntimeException('Invalid payment closure action.');
        }
        $url = rtrim((string) config('services.midtrans.api_url'), '/').'/'.rawurlencode($order->order_number);
        $client = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')->acceptJson()->timeout(10);
        $response = $client->get($url.'/status');
        if ($response->status() === 404 || (string) $response->json('status_code') === '404') {
            $token = $order->payment?->snap_token;
            if (! $token) {
                throw new RuntimeException('Payment initialization is uncertain; keep the reservation for reconciliation.');
            }
            $snap = Http::withHeaders(['Authorization' => (string) config('services.midtrans.server_key')])
                ->acceptJson()->timeout(10)->post(rtrim((string) config('services.midtrans.snap_url'), '/').'/'.rawurlencode($token).'/cancel');
            $alreadyClosed = in_array('token already canceled', (array) $snap->json('error_messages'), true);
            if (! ($snap->successful() && $snap->json('canceled_at')) && ! $alreadyClosed) {
                throw new RuntimeException('Snap session closure is not confirmed.');
            }
            // A charge may have started while the Snap session was being closed.
            $response = $client->get($url.'/status');
            if ($response->status() === 404 || (string) $response->json('status_code') === '404') {
                return ['transaction_status' => 'cancel', 'order_id' => $order->order_number];
            }
        }
        $response->throw();
        if ($response->json('transaction_status') === 'pending') {
            // Re-read even after a rejected operation: payment may have won the race.
            $client->post($url.'/'.$action);
            $response = $client->get($url.'/status')->throw();
        }
        $payload = $response->json();
        if (! is_array($payload) || ! in_array($payload['transaction_status'] ?? '', ['cancel', 'expire', 'settlement', 'capture'], true)
            || ($payload['transaction_status'] === 'capture' && ($payload['fraud_status'] ?? '') !== 'accept')) {
            throw new RuntimeException('Provider payment state is not final; retry reconciliation.');
        }

        return $payload;
    }

    public function verifyWebhook(array $payload): bool
    {
        $expected = hash('sha512', ($payload['order_id'] ?? '').($payload['status_code'] ?? '').($payload['gross_amount'] ?? '').config('services.midtrans.server_key'));

        return isset($payload['signature_key']) && is_string($payload['signature_key']) && hash_equals($expected, $payload['signature_key']);
    }
}
