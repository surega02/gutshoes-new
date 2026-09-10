<?php

namespace App\Domain\Order;

use App\Enums\UserRole;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderAccess
{
    public function authorize(Request $request, Order $order): void
    {
        $user = $request->user();
        if ($user && ($user->role === UserRole::ADMIN || $order->user_id === $user->id)) {
            return;
        }
        abort_if($order->user_id !== null, 404);
        app(GuestOrderAccess::class)->authorize($request, $order);
    }
}
