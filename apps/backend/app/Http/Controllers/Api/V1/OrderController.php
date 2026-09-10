<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cart\CartResolver;
use App\Domain\Order\CreateOrderService;
use App\Domain\Order\GuestOrderAccess;
use App\Domain\Shipping\RegionAddressResolver;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function store(Request $request, CartResolver $resolver, CreateOrderService $orders, GuestOrderAccess $guestAccess): JsonResponse
    {
        $payload = $request->validate([
            'customer' => ['required', 'array'], 'customer.name' => ['required', 'string', 'max:255'],
            'customer.email' => ['required', 'email', 'max:255'], 'customer.phone' => ['required', 'string', 'max:32'],
            'address' => ['required', 'array'], 'address.recipient_name' => ['required', 'string', 'max:255'],
            'address.phone' => ['required', 'string', 'max:32'], 'address.address_line' => ['required', 'string', 'max:255'],
            'address.province_code' => ['required', 'exists:region_provinces,code'], 'address.regency_code' => ['required', 'exists:region_regencies,code'], 'address.district_code' => ['required', 'exists:region_districts,code'], 'address.village_code' => ['required', 'exists:region_villages,code'],
            'address.province' => ['nullable', 'string', 'max:255'], 'address.city' => ['nullable', 'string', 'max:255'],
            'address.district' => ['nullable', 'string', 'max:255'], 'address.postal_code' => ['required', 'string', 'max:10'],
            'address.provider_area_id' => ['required', 'string', 'max:255'], 'shipping' => ['required', 'array'],
            'shipping.courier' => ['nullable', 'string', 'max:64'], 'shipping.service' => ['required', 'string', 'max:64'],
            'voucher_code' => ['nullable', 'string', 'max:64'],
        ]);
        $payload['address'] = app(RegionAddressResolver::class)->resolve($payload['address']);
        $key = $request->header('Idempotency-Key');
        abort_unless(is_string($key) && strlen($key) >= 16 && strlen($key) <= 128, 422, 'A valid Idempotency-Key header is required.');
        // Scope retries to the authenticated owner or the unguessable guest cart token.
        $owner = $request->user() ? 'user:'.$request->user()->id : 'guest:'.$request->header('X-Guest-Cart-Token');
        abort_unless($request->user() || filled($request->header('X-Guest-Cart-Token')), 422);
        $key = hash('sha256', $owner.'|'.$key);
        if ($request->user()) {
            $payload['customer']['email'] = $request->user()->email;
        }
        $cart = $resolver->resolve($request, false);
        $result = $orders->create($cart, $payload, $key);

        $order = $result->order;
        $token = $guestAccess->issue($order);
        $data = $order->toArray();
        if ($token !== null) {
            $data['guest_access_token'] = $token;
            $data['guest_order_url'] = $guestAccess->recoveryUrl($order);
        }

        return response()->json(['data' => $data], $result->created ? 201 : 200);
    }
}
