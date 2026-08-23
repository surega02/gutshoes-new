<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cart\CartResolver;
use App\Domain\Order\CreateOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function store(Request $request, CartResolver $resolver, CreateOrderService $orders): JsonResponse
    {
        $payload = $request->validate([
            'customer' => ['required', 'array'], 'customer.name' => ['required', 'string', 'max:255'],
            'customer.email' => ['required', 'email', 'max:255'], 'customer.phone' => ['required', 'string', 'max:32'],
            'address' => ['required', 'array'], 'address.recipient_name' => ['required', 'string', 'max:255'],
            'address.phone' => ['required', 'string', 'max:32'], 'address.address_line' => ['required', 'string', 'max:255'],
            'address.province' => ['required', 'string', 'max:255'], 'address.city' => ['required', 'string', 'max:255'],
            'address.district' => ['required', 'string', 'max:255'], 'address.postal_code' => ['required', 'string', 'max:10'],
            'address.provider_area_id' => ['required', 'string', 'max:255'], 'shipping' => ['required', 'array'],
            'shipping.courier' => ['nullable', 'string', 'max:64'], 'shipping.service' => ['required', 'string', 'max:64'],
            'voucher_code' => ['nullable', 'string', 'max:64'],
        ]);
        $key = $request->header('Idempotency-Key');
        abort_unless(is_string($key) && strlen($key) >= 16 && strlen($key) <= 128, 422, 'A valid Idempotency-Key header is required.');
        $cart = $resolver->resolve($request, false);
        $result = $orders->create($cart, $payload, $key);

        return response()->json(['data' => $result->order], $result->created ? 201 : 200);
    }
}
