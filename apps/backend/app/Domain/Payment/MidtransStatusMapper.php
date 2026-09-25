<?php

namespace App\Domain\Payment;

use App\Enums\PaymentStatus;

class MidtransStatusMapper
{
    /** @param array<string, mixed> $payload */
    public function internalStatus(array $payload): PaymentStatus
    {
        $providerStatus = strtolower((string) ($payload['transaction_status'] ?? ''));
        $fraudStatus = strtolower((string) ($payload['fraud_status'] ?? ''));

        if ($providerStatus === 'settlement' || ($providerStatus === 'capture' && $fraudStatus === 'accept')) {
            return PaymentStatus::SUCCESS;
        }

        if (in_array($providerStatus, ['deny', 'failure', 'cancel', 'expire'], true)
            || ($providerStatus === 'capture' && $fraudStatus === 'deny')) {
            return PaymentStatus::FAILED;
        }

        return PaymentStatus::PENDING;
    }
}
