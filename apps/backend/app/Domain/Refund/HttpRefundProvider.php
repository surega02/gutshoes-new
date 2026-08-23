<?php

namespace App\Domain\Refund;

use App\Models\Payment;
use App\Models\Refund;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class HttpRefundProvider implements RefundProvider
{
    public function refund(Refund $refund): array
    {
        $payment = Payment::findOrFail($refund->payment_id);
        $url = rtrim((string) config('services.midtrans.api_url'), '/').'/'.urlencode((string) $payment->provider_transaction_id).'/refund';
        $raw = Http::withBasicAuth((string) config('services.midtrans.server_key'), '')->timeout(10)->retry(2, 250)
            ->post($url, ['refund_key' => $refund->idempotency_key, 'amount' => (int) $refund->amount, 'reason' => $refund->reason])->throw()->json();
        if (! is_array($raw)) {
            throw new RuntimeException('Invalid Midtrans refund response.');
        }

        return ['id' => (string) ($raw['refund_key'] ?? $refund->idempotency_key), 'status' => in_array((string) ($raw['status_code'] ?? ''), ['200', '201'], true) ? 'SUCCESS' : 'FAILED', 'raw' => $raw];
    }
}
