<?php

namespace App\Domain\Payment;

use App\Models\Order;

interface MidtransProvider
{
    /** @return array{token:string,redirect_url:string,transaction_id:?string} */
    public function createSnapTransaction(Order $order): array;

    /** @param array<string,mixed> $payload */
    public function verifyWebhook(array $payload): bool;
}
