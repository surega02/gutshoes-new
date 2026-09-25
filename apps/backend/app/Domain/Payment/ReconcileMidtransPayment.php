<?php

namespace App\Domain\Payment;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class ReconcileMidtransPayment
{
    public function __construct(
        private readonly MidtransProvider $provider,
        private readonly ApplyMidtransStatus $statuses,
    ) {}

    /**
     * Fetches the canonical Midtrans state and applies it idempotently.
     * Null means Midtrans does not know this order ID yet.
     */
    public function reconcile(Order $order): ?Payment
    {
        $payload = $this->provider->getStatus($order);
        if ($payload === null) {
            return null;
        }

        return DB::transaction(function () use ($order, $payload): Payment {
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $payment = Payment::where('order_id', $lockedOrder->id)
                ->where('provider', 'MIDTRANS')
                ->lockForUpdate()
                ->firstOrFail();

            $this->statuses->apply($lockedOrder, $payment, $payload);

            return $payment->refresh();
        }, 3);
    }
}
