<?php

namespace App\Domain\Refund;

use App\Models\Refund;

class FakeRefundProvider implements RefundProvider
{
    public function refund(Refund $refund): array
    {
        return ['id' => 'fake-refund-'.$refund->id, 'status' => 'SUCCESS', 'raw' => ['status_code' => '200']];
    }
}
