<?php

namespace App\Domain\Order;

use App\Domain\Inventory\InventoryService;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\OrderCancellation;
use App\Models\Refund;
use DomainException;
use Illuminate\Support\Facades\DB;

class CancelOrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    public function cancel(Order $order, string $reason, string $idempotencyKey, ?int $actorId): OrderCancellation
    {
        return DB::transaction(function () use ($order, $reason, $idempotencyKey, $actorId): OrderCancellation {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $status = (string) $order->getRawOriginal('status');
            if (! in_array($status, [OrderStatus::PENDING_PAYMENT->value, OrderStatus::PAID->value], true)) {
                throw new DomainException("Order in {$status} state cannot be cancelled.");
            }
            if ($existing = OrderCancellation::where('order_id', $order->id)->first()) {
                return $existing;
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
                Refund::firstOrCreate(['idempotency_key' => $idempotencyKey], ['order_id' => $order->id, 'payment_id' => $payment->id, 'status' => 'PENDING',
                    'amount' => $payment->amount, 'currency' => $payment->currency, 'reason' => $reason]);
            }
            $order->update(['status' => OrderStatus::CANCELLED->value]);
            $order->statusHistories()->create(['from_status' => $status, 'to_status' => OrderStatus::CANCELLED->value, 'actor_id' => $actorId, 'note' => $reason]);

            return $cancellation->load('order');
        }, 3);
    }
}
