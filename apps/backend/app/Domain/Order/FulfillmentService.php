<?php

namespace App\Domain\Order;

use App\Jobs\SendOrderEmail;
use App\Models\Order;
use DomainException;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

class FulfillmentService
{
    /** @var array<string,string> */
    private const NEXT = ['PAID' => 'PROCESSING', 'PROCESSING' => 'SHIPPED', 'SHIPPED' => 'DELIVERED'];

    /** @param array<string,mixed> $data */
    public function transition(Order $order, string $target, array $data, ?int $actorId): Order
    {
        return DB::transaction(function () use ($order, $target, $data, $actorId): Order {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $from = (string) $order->getRawOriginal('status');
            if ((self::NEXT[$from] ?? null) !== $target) {
                throw new DomainException("Invalid order transition from {$from} to {$target}.");
            }
            if ($target === 'SHIPPED') {
                if (empty($data['tracking_number'])) {
                    throw new DomainException('Tracking number is required to ship an order.');
                }
                $order->shipment()->update(['tracking_number' => $data['tracking_number'], 'status' => 'SHIPPED', 'shipped_at' => now()]);
            } elseif ($target === 'DELIVERED') {
                $order->shipment()->update(['status' => 'DELIVERED', 'delivered_at' => now()]);
            } elseif ($target === 'PROCESSING') {
                $order->shipment()->update(['status' => 'READY']);
            }
            $order->update(['status' => $target]);
            $order->statusHistories()->create(['from_status' => $from, 'to_status' => $target, 'actor_id' => $actorId, 'note' => $data['note'] ?? null]);
            if (in_array($target, ['SHIPPED', 'DELIVERED'], true)) {
                Bus::dispatch(new SendOrderEmail($order->id, strtolower($target)));
            }

            return $order->load(['items', 'addresses', 'shipment', 'statusHistories']);
        }, 3);
    }
}
