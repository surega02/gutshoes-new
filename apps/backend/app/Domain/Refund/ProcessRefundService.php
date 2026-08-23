<?php

namespace App\Domain\Refund;

use App\Models\Refund;
use Illuminate\Support\Facades\DB;

class ProcessRefundService
{
    public function __construct(private readonly RefundProvider $provider) {}

    public function process(Refund $refund): Refund
    {
        if ($refund->status === 'SUCCESS') {
            return $refund;
        }

        return DB::transaction(function () use ($refund): Refund {
            $refund = Refund::query()->lockForUpdate()->findOrFail($refund->id);
            if ($refund->status === 'SUCCESS') {
                return $refund;
            }
            $result = $this->provider->refund($refund);
            $refund->update(['provider_refund_id' => $result['id'], 'status' => $result['status'], 'provider_response' => $result['raw'],
                'completed_at' => $result['status'] === 'SUCCESS' ? now() : null]);

            return $refund->refresh();
        }, 3);
    }
}
