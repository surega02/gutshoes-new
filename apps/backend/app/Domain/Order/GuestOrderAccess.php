<?php

namespace App\Domain\Order;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class GuestOrderAccess
{
    public function issue(Order $order): ?string
    {
        if ($order->user_id !== null) {
            return null;
        }

        if (is_string($order->guest_access_token) && $order->guest_access_token !== '') {
            return $order->guest_access_token;
        }

        $token = Str::random(64);
        $order->forceFill([
            'guest_access_token' => $token,
            'guest_access_token_hash' => hash('sha256', $token),
        ])->save();

        return $token;
    }

    public function authorize(Request $request, Order $order): void
    {
        if ($order->user_id !== null) {
            abort_unless($request->user()?->id === $order->user_id, 404);
        }
        $token = $request->header('X-Guest-Order-Token');
        if (! is_string($token) || strlen($token) < 32 || ! is_string($order->guest_access_token_hash) ||
            ! hash_equals($order->guest_access_token_hash, hash('sha256', $token))) {
            throw new NotFoundHttpException;
        }
    }

    public function recoveryUrl(Order $order): ?string
    {
        $token = $order->guest_access_token;
        if (! is_string($token) || $token === '') {
            return null;
        }

        return rtrim((string) config('services.storefront.url'), '/').'/?'.http_build_query([
            'guest_order' => $order->order_number,
            'token' => $token,
        ]).'#tracking';
    }
}
