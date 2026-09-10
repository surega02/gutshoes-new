<?php

namespace App\Domain\Order;

use App\Domain\Inventory\InventoryService;
use App\Domain\Payment\ClosePendingPayment;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Jobs\SendOrderEmail;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderCancellation;
use App\Models\Refund;
use DomainException;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

class CancelOrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function cancel(Order $order, string $reason, string $idempotencyKey, ?int $actorId): OrderCancellation
    {
        return DB::transaction(function () use ($order, $reason, $actorId): OrderCancellation {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($existing = OrderCancellation::where('order_id', $order->id)->first()) {
                return $existing->load('order');
            }
            $status = (string) $order->getRawOriginal('status');
            if ($status === 'PENDING_PAYMENT') {
                $closed = app(ClosePendingPayment::class)->close($order, 'cancel');
                $status = (string) $order->getRawOriginal('status');
                if (! $closed && $status === OrderStatus::CANCELLED->value) {
                    // Preserve payment reconciliation when stock was already released.
                    $cancellation = OrderCancellation::create(['order_id' => $order->id, 'requested_by' => $actorId, 'status' => 'APPROVED', 'reason' => $reason, 'resolved_at' => now()]);
                    Bus::dispatch(new SendOrderEmail($order->id, 'order_cancelled'));

                    return $cancellation->load('order');
                }
            }
            if (! in_array($status, [OrderStatus::PENDING_PAYMENT->value, OrderStatus::PAID->value], true)) {
                throw new DomainException("Order in {$status} state cannot be cancelled.");
            }
            $cancellation = OrderCancellation::create(['order_id' => $order->id, 'requested_by' => $actorId, 'status' => 'APPROVED', 'reason' => $reason, 'resolved_at' => now()]);
            if ($status === OrderStatus::PENDING_PAYMENT->value) {
                foreach (InventoryReservation::where('order_id', $order->id)->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
                    $this->inventory->release($reservation);
                }
                $order->payment?->update(['status' => 'CANCEL']);
            } else {
                $payment = $order->payment;
                if (! $payment) {
                    throw new DomainException('Paid order has no payment record.');
                }
                Refund::firstOrCreate(['order_id' => $order->id, 'payment_id' => $payment->id], ['idempotency_key' => 'cancellation-'.$order->id, 'status' => 'PENDING',
                    'amount' => $payment->amount, 'currency' => $payment->currency, 'reason' => $reason]);
            }
            $order->update(['status' => OrderStatus::CANCELLED->value]);
            $order->statusHistories()->create(['from_status' => $status, 'to_status' => OrderStatus::CANCELLED->value, 'actor_id' => $actorId, 'note' => $reason]);

            Bus::dispatch(new SendOrderEmail($order->id, 'order_cancelled'));

            return $cancellation->load('order');
        }, 3);
    }
}
