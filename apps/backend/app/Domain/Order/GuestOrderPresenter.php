<?php

namespace App\Domain\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Carbon;

class GuestOrderPresenter
{
    /** @return array<string,mixed> */
    public function present(Order $order): array
    {
        $order->loadMissing(['items', 'payment', 'shipment', 'statusHistories']);
        $expiresAt = Carbon::parse($order->expires_at);
        $payment = $order->getRelation('payment');
        $canPay = $order->getRawOriginal('status') === OrderStatus::PENDING_PAYMENT->value && $expiresAt->isFuture();

        return [
            'order_number' => $order->order_number,
            'status' => $order->getRawOriginal('status'),
            'payment_status' => $payment instanceof Payment ? $payment->status : 'NOT_STARTED',
            'can_pay' => $canPay,
            'expires_at' => $expiresAt->toIso8601String(),
            'currency' => $order->currency,
            'subtotal' => $order->subtotal,
            'product_discount' => $order->product_discount,
            'voucher_discount' => $order->voucher_discount,
            'shipping_fee' => $order->shipping_fee,
            'grand_total' => $order->grand_total,
            'items' => $order->items->map(fn ($item): array => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'brand_name' => $item->brand_name,
                'sku' => $item->sku,
                'size_label' => $item->size_label,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ])->values(),
            'shipment' => $order->shipment ? [
                'provider' => $order->shipment->provider,
                'courier' => $order->shipment->courier,
                'service' => $order->shipment->service,
                'fee' => $order->shipment->fee,
                'status' => $order->shipment->status,
                'tracking_number' => $order->shipment->tracking_number,
            ] : null,
            'timeline' => $order->statusHistories->map(fn ($history): array => [
                'from_status' => $history->from_status,
                'to_status' => $history->to_status,
                'note' => $history->note,
                'created_at' => $history->created_at?->toIso8601String(),
            ])->values(),
        ];
    }
}
