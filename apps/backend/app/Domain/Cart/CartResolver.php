<?php

namespace App\Domain\Cart;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartResolver
{
    public function resolve(Request $request, bool $create = true): ?Cart
    {
        /** @var User|null $user */ $user = $request->user();
        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id, 'status' => 'ACTIVE'], ['guest_token' => null]);
        }
        $token = $request->header('X-Guest-Cart-Token');
        if ($token) {
            $cart = Cart::where('guest_token', $token)->where('status', 'ACTIVE')->first();
            if ($cart) {
                return $cart;
            }
        }

        return $create ? Cart::create(['guest_token' => (string) Str::uuid(), 'status' => 'ACTIVE']) : null;
    }
}
