<?php

namespace App\Domain\Payment;

use App\Models\Order;

interface MidtransProvider
{
    /** @return array{token:string,redirect_url:string,transaction_id:?string} */
    public function createSnapTransaction(Order $order): array;

    /** @return array<string,mixed> Confirmed provider state; throw if it is uncertain. */
    public function closeTransaction(Order $order, string $action): array;

    /** @param array<string,mixed> $payload */
    public function verifyWebhook(array $payload): bool;
}
