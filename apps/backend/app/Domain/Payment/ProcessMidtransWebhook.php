<?php

namespace App\Domain\Payment;

use App\Domain\Inventory\InventoryService;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhook;
use DomainException;
use Illuminate\Support\Facades\DB;

class ProcessMidtransWebhook
{
    public function __construct(private readonly MidtransProvider $provider, private readonly InventoryService $inventory) {}

    /** @param array<string,mixed> $payload */
    public function handle(array $payload): PaymentWebhook
    {
        if (! $this->provider->verifyWebhook($payload)) {
            throw new InvalidWebhookSignature;
        }
        $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
        $eventId = hash('sha256', implode('|', [$payload['transaction_id'] ?? '', $payload['transaction_status'] ?? '', $payload['status_code'] ?? '', $payload['settlement_time'] ?? $payload['transaction_time'] ?? '']));
        if ($existing = PaymentWebhook::where('event_id', $eventId)->first()) {
            return $existing;
        }

        return DB::transaction(function () use ($payload, $hash, $eventId): PaymentWebhook {
            if ($existing = PaymentWebhook::where('event_id', $eventId)->lockForUpdate()->first()) {
                return $existing;
            }
            $event = PaymentWebhook::create(['provider' => 'MIDTRANS', 'event_id' => $eventId, 'transaction_id' => $payload['transaction_id'] ?? null,
                'payload_hash' => $hash, 'payload_redacted' => $this->redact($payload)]);
            $order = Order::where('order_number', $payload['order_id'])->lockForUpdate()->first();
            if (! $order) {
                $event->update(['processing_error' => 'Order not found', 'processed_at' => now()]);

                return $event;
            }
            $payment = Payment::where('order_id', $order->id)->where('provider', 'MIDTRANS')->lockForUpdate()->first();
            if (! $payment) {
                throw new DomainException('Payment record not found.');
            }
            $status = (string) ($payload['transaction_status'] ?? '');
            $success = $status === 'settlement' || ($status === 'capture' && ($payload['fraud_status'] ?? 'accept') === 'accept');
            if ($success && $order->getRawOriginal('status') === OrderStatus::PENDING_PAYMENT->value) {
                $payment->update(['status' => strtoupper($status), 'provider_transaction_id' => $payload['transaction_id'] ?? $payment->provider_transaction_id, 'paid_at' => now()]);
                foreach (InventoryReservation::where('order_id', $order->id)->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
                    $this->inventory->sell($reservation);
                }
                $order->update(['status' => OrderStatus::PAID->value]);
                $order->statusHistories()->create(['from_status' => OrderStatus::PENDING_PAYMENT->value, 'to_status' => OrderStatus::PAID->value, 'note' => 'Midtrans payment confirmed']);
            } elseif (in_array($status, ['expire', 'cancel', 'deny'], true) && $order->getRawOriginal('status') === OrderStatus::PENDING_PAYMENT->value) {
                $payment->update(['status' => strtoupper($status), 'provider_transaction_id' => $payload['transaction_id'] ?? $payment->provider_transaction_id]);
                foreach (InventoryReservation::where('order_id', $order->id)->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
                    $this->inventory->release($reservation, ReservationStatus::EXPIRED);
                }
                $order->update(['status' => OrderStatus::EXPIRED->value]);
                $order->statusHistories()->create(['from_status' => OrderStatus::PENDING_PAYMENT->value, 'to_status' => OrderStatus::EXPIRED->value, 'note' => 'Midtrans payment expired']);
            }
            $event->update(['processed_at' => now()]);

            return $event->refresh();
        }, 3);
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
