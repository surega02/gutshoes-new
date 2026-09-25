<?php

namespace App\Domain\Payment;

use App\Domain\Inventory\InventoryService;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Jobs\SendOrderEmail;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Bus;

class ApplyMidtransStatus
{
    public function __construct(
        private readonly MidtransStatusMapper $statuses,
        private readonly ConfirmPayment $confirmation,
        private readonly InventoryService $inventory,
    ) {}

    /**
     * Caller must hold the order and payment locks inside a database transaction.
     *
     * @param  array<string, mixed>  $payload
     */
    public function apply(Order $order, Payment $payment, array $payload): void
    {
        $this->confirmation->validate($order, $payment, $payload);

        $providerStatus = strtolower((string) ($payload['transaction_status'] ?? ''));
        $internalStatus = $this->statuses->internalStatus($payload);
        if ($internalStatus === PaymentStatus::SUCCESS) {
            $this->confirmation->apply($order, $payment, $payload);

            return;
        }

        // Provider notifications can arrive out of order. Internal states only move
        // PENDING -> FAILED -> SUCCESS; a late pending/failure cannot undo success.
        $currentStatus = PaymentStatus::from($payment->status);
        $nextStatus = match (true) {
            $payment->paid_at !== null || $currentStatus === PaymentStatus::SUCCESS => PaymentStatus::SUCCESS,
            $currentStatus === PaymentStatus::FAILED => PaymentStatus::FAILED,
            default => $internalStatus,
        };

        $payment->update([
            'status' => $nextStatus->value,
            'provider_status' => $providerStatus,
            'provider_transaction_id' => $payload['transaction_id'] ?? $payment->provider_transaction_id,
        ]);

        if (! in_array($providerStatus, ['cancel', 'expire'], true)
            || $payment->paid_at !== null
            || $order->getRawOriginal('status') !== OrderStatus::PENDING_PAYMENT->value) {
            return;
        }

        foreach (InventoryReservation::where('order_id', $order->id)
            ->where('status', ReservationStatus::ACTIVE->value)->get() as $reservation) {
            $this->inventory->release($reservation, ReservationStatus::EXPIRED);
        }
        $order->update(['status' => OrderStatus::EXPIRED->value]);
        $order->statusHistories()->create([
            'from_status' => OrderStatus::PENDING_PAYMENT->value,
            'to_status' => OrderStatus::EXPIRED->value,
            'note' => 'Midtrans payment failed: '.$providerStatus,
        ]);
        Bus::dispatch(new SendOrderEmail($order->id, 'payment_expired'));
    }
}
