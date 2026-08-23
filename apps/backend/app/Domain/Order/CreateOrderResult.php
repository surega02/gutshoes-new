<?php

namespace App\Domain\Order;

use App\Models\Order;

final readonly class CreateOrderResult
{
    public function __construct(public Order $order, public bool $created) {}
}
