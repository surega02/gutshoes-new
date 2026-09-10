<?php

namespace App\Domain\Payment;

use App\Domain\Inventory\InventoryService;
use App\Enums\ReservationStatus;
use App\Jobs\SendOrderEmail;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use DomainException;
use Illuminate\Support\Facades\Bus;

class ConfirmPayment
{
    public function __construct(private readonly InventoryService $inventory) {}

    /** Caller holds the order lock, inside a database transaction.
     * @param  array<string,mixed>  $payload
     */
    public function apply(Order $order, Payment $payment, array $payload): void
    {
        $this->validate($order, $payment, $payload);
        if ($payment->paid_at !== null) {
            return;
        }
        $payment->update(['status' => strtoupper($payload['transaction_status']),
            'provider_transaction_id' => $payload['transaction_id'], 'paid_at' => now()]);
        $reservations = InventoryReservation::where('order_id', $order->id)->lockForUpdate()->get();
        $active = $reservations->where('status', ReservationStatus::ACTIVE->value);
        $expected = (int) $order->items()->sum('quantity');
        $canFulfill = $order->getRawOriginal('status') === 'PENDING_PAYMENT'
            && $active->isNotEmpty() && $active->count() === $reservations->count()
            && ($expected > 0 && (int) $active->sum('quantity') === $expected);
        if ($canFulfill) {
            foreach ($active as $reservation) {
                $this->inventory->sell($reservation);
            }
            $order->update(['status' => 'PAID']);
            $order->statusHistories()->create(['from_status' => 'PENDING_PAYMENT', 'to_status' => 'PAID', 'note' => 'Midtrans payment confirmed']);
            Bus::dispatch(new SendOrderEmail($order->id, 'payment_success'));

            return;
        }
        // Money was received after closure, or the reservation cannot be fulfilled.
        // Never resurrect the order or consume stock that may belong to another buyer.
        foreach ($active as $reservation) {
            $this->inventory->release($reservation);
        }
        if ($order->getRawOriginal('status') === 'PENDING_PAYMENT') {
            $order->update(['status' => 'CANCELLED']);
            $order->statusHistories()->create(['from_status' => 'PENDING_PAYMENT', 'to_status' => 'CANCELLED', 'note' => 'Payment received without a complete reservation; refund requires review']);
        }
        Refund::firstOrCreate(['idempotency_key' => 'payment-reconciliation-'.$order->id], [
            'order_id' => $order->id, 'payment_id' => $payment->id, 'status' => 'PENDING',
            'amount' => $payment->amount, 'currency' => $payment->currency,
            'reason' => 'Payment received after order closure or reservation release; review required',
        ]);
    }

    /** @param array<string,mixed> $payload */
    public function validate(Order $order, Payment $payment, array $payload): void
    {
        $amount = $payload['gross_amount'] ?? '';
        if (! is_scalar($amount) || ! preg_match('/^\d+(\.\d{1,2})?$/', (string) $amount)
            || number_format((float) $amount, 2, '.', '') !== (string) $payment->amount
            || (string) $payment->amount !== (string) $order->grand_total
            || ($payload['currency'] ?? 'IDR') !== $order->currency
            || ($payload['order_id'] ?? null) !== $order->order_number
            || empty($payload['transaction_id'])
            || ($payment->provider_transaction_id && $payment->provider_transaction_id !== $payload['transaction_id'])) {
            throw new DomainException('Payment details do not match the order.');
        }
    }
}
