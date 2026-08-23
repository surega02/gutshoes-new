<?php

namespace App\Jobs;

use App\Domain\Inventory\InventoryService;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ExpirePendingOrders implements ShouldQueue
{
    use Queueable;

    public function handle(InventoryService $inventory): void
    {
        Order::where('status', OrderStatus::PENDING_PAYMENT->value)->where('expires_at', '<=', now())->pluck('id')->each(function (int $id) use ($inventory): void {
            DB::transaction(function () use ($id, $inventory): void {
                $order = Order::query()->lockForUpdate()->find($id);
                if (! $order || $order->getRawOriginal('status') !== OrderStatus::PENDING_PAYMENT->value || Carbon::parse($order->expires_at)->isFuture()) {
                    return;
                }
                foreach (InventoryReservation::where('order_id', $order->id)->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
                    $inventory->release($reservation, ReservationStatus::EXPIRED);
                }
                $order->payment?->update(['status' => 'EXPIRE']);
                $order->update(['status' => OrderStatus::EXPIRED->value]);
                $order->statusHistories()->create(['from_status' => OrderStatus::PENDING_PAYMENT->value, 'to_status' => OrderStatus::EXPIRED->value, 'note' => 'Payment window expired']);
            }, 3);
        });
    }
}
