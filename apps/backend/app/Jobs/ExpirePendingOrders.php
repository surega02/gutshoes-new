<?php

namespace App\Jobs;

use App\Domain\Inventory\InventoryService;
use App\Domain\Payment\ClosePendingPayment;
use App\Enums\OrderStatus;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

class ExpirePendingOrders implements ShouldQueue
{
    use Queueable;

    public function handle(InventoryService $inventory): void
    {
        Order::where('status', OrderStatus::PENDING_PAYMENT->value)->where('expires_at', '<=', now())->pluck('id')->each(function (int $id) use ($inventory): void {
            try {
                DB::transaction(function () use ($id, $inventory): void {
                    $order = Order::query()->lockForUpdate()->find($id);
                    if (! $order || $order->getRawOriginal('status') !== OrderStatus::PENDING_PAYMENT->value || Carbon::parse($order->expires_at)->isFuture()) {
                        return;
                    }
                    if (! app(ClosePendingPayment::class)->close($order, 'expire')) {
                        return;
                    }
                    foreach (InventoryReservation::where('order_id', $order->id)->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
                        $inventory->release($reservation, ReservationStatus::EXPIRED);
                    }
                    $order->payment?->update(['status' => 'EXPIRE']);
                    $order->update(['status' => OrderStatus::EXPIRED->value]);
                    Bus::dispatch(new SendOrderEmail($order->id, 'payment_expired'));
                    $order->statusHistories()->create(['from_status' => OrderStatus::PENDING_PAYMENT->value, 'to_status' => OrderStatus::EXPIRED->value, 'note' => 'Payment window expired']);
                }, 3);
            } catch (\Throwable $error) {
                // Keep this order reserved, but do not starve other expired orders.
                report($error);
            }
        });
    }
}
