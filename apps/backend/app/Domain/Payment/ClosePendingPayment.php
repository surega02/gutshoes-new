<?php

namespace App\Domain\Payment;

use App\Enums\PaymentStatus;
use App\Models\Order;

class ClosePendingPayment
{
    public function __construct(
        private readonly MidtransProvider $provider,
        private readonly ConfirmPayment $confirmation,
        private readonly MidtransStatusMapper $statuses,
    ) {}

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
        $internalStatus = $this->statuses->internalStatus($payload);
        if ($internalStatus === PaymentStatus::SUCCESS) {
            $this->confirmation->apply($order, $payment, $payload);

            return false;
        }
        if ($internalStatus !== PaymentStatus::FAILED) {
            throw new \RuntimeException('Payment closure is not confirmed.');
        }
        if (($payload['order_id'] ?? null) !== $order->order_number) {
            throw new \RuntimeException('Provider returned another order.');
        }
        if (isset($payload['gross_amount'])) {
            $this->confirmation->validate($order, $payment, $payload);
        }
        $payment->update([
            'status' => PaymentStatus::FAILED->value,
            'provider_status' => (string) $payload['transaction_status'],
        ]);

        return true;
    }
}
