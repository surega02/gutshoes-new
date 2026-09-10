<?php

namespace App\Domain\Payment;

use App\Models\Order;

class ClosePendingPayment
{
    public function __construct(private readonly MidtransProvider $provider, private readonly ConfirmPayment $confirmation) {}

    // Caller holds the order lock. False means payment won the race and was reconciled.
    public function close(Order $order, string $action): bool
    {
        $payment = $order->payment()->lockForUpdate()->first();
        if (! $payment) {
            return true;
        }
        if ($payment->paid_at !== null) {
            return false;
        }
        $payload = $this->provider->closeTransaction($order, $action);
        if (in_array($payload['transaction_status'] ?? '', ['settlement', 'capture'], true)) {
            $this->confirmation->apply($order, $payment, $payload);

            return false;
        }
        if (! in_array($payload['transaction_status'] ?? '', ['cancel', 'expire', 'deny', 'failure'], true)) {
            throw new \RuntimeException('Payment closure is not confirmed.');
        }
        if (($payload['order_id'] ?? null) !== $order->order_number) {
            throw new \RuntimeException('Provider returned another order.');
        }
        if (isset($payload['gross_amount'])) {
            $this->confirmation->validate($order, $payment, $payload);
        }
        $payment->update(['status' => strtoupper($payload['transaction_status'])]);

        return true;
    }
}
