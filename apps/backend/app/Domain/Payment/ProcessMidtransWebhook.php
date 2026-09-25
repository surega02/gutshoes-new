<?php

namespace App\Domain\Payment;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhook;
use DomainException;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProcessMidtransWebhook
{
    public function __construct(
        private readonly MidtransProvider $provider,
        private readonly ApplyMidtransStatus $statuses,
    ) {}

    /** @param array<string,mixed> $payload */
    public function handle(array $payload): PaymentWebhook
    {
        if (! $this->provider->verifyWebhook($payload)) {
            throw new InvalidWebhookSignature;
        }
        $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
        $eventId = hash('sha256', implode('|', [$payload['order_id'] ?? '', $payload['transaction_id'] ?? '', $payload['transaction_status'] ?? '', $payload['fraud_status'] ?? '', $payload['status_code'] ?? '', $payload['settlement_time'] ?? $payload['transaction_time'] ?? '']));
        $event = PaymentWebhook::firstOrCreate(['event_id' => $eventId], [
            'provider' => 'MIDTRANS',
            'transaction_id' => $payload['transaction_id'] ?? null,
            'payload_hash' => $hash,
            'payload_redacted' => $this->redact($payload),
        ]);
        if ($event->processed_at !== null) {
            return $event;
        }

        try {
            return DB::transaction(function () use ($payload, $event): PaymentWebhook {
                $event = PaymentWebhook::whereKey($event->id)->lockForUpdate()->firstOrFail();
                if ($event->processed_at !== null) {
                    return $event;
                }
                $order = Order::where('order_number', $payload['order_id'])->lockForUpdate()->first();
                if (! $order) {
                    $event->update(['processing_error' => 'Order not found', 'processed_at' => now()]);

                    return $event->refresh();
                }
                $payment = Payment::where('order_id', $order->id)->where('provider', 'MIDTRANS')->lockForUpdate()->first();
                if (! $payment) {
                    throw new DomainException('Payment record not found.');
                }
                $this->statuses->apply($order, $payment, $payload);
                $event->update(['processing_error' => null, 'processed_at' => now()]);

                return $event->refresh();
            }, 3);
        } catch (Throwable $error) {
            // Audit is intentionally committed before business processing so failed
            // amount/order/transaction validation remains observable.
            $event->update([
                'processing_error' => mb_substr(class_basename($error).': '.$error->getMessage(), 0, 255),
                'processed_at' => now(),
            ]);

            throw $error;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function redact(array $payload): array
    {
        foreach (['signature_key', 'card_number', 'masked_card', 'token_id'] as $key) {
            if (array_key_exists($key, $payload)) {
                $payload[$key] = '[REDACTED]';
            }
        }

        return $payload;
    }
}
