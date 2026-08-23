<?php

namespace App\Domain\Refund;

use App\Models\Refund;

interface RefundProvider
{
    /** @return array{id:string,status:string,raw:array<string,mixed>} */
    public function refund(Refund $refund): array;
}
