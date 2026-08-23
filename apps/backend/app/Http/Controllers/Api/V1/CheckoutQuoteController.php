<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cart\CartResolver;
use App\Domain\Promotion\PricingService;
use App\Domain\Shipping\ShippingProvider;
use App\Domain\Shipping\ShippingQuote;
use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutQuoteController extends Controller
{
    public function __invoke(Request $request, CartResolver $resolver, PricingService $pricing, ShippingProvider $shipping): JsonResponse
    {
        $d = $request->validate(['destination_area_id' => ['required', 'string', 'max:255'], 'courier' => ['nullable', 'string', 'max:32'], 'service' => ['required', 'string', 'max:64'], 'voucher_code' => ['nullable', 'string', 'max:64']]);
        $cart = $resolver->resolve($request, false);
        abort_unless($cart && $cart->items()->exists(), 422, 'Cart is empty.');
        $cart->load('items.variant');
        $warehouse = Warehouse::where('is_active', true)->firstOrFail();
        $weight = (int) $cart->items->sum(fn ($i) => $i->variant->weight_grams * $i->quantity);
        $quantity = (int) $cart->items->sum('quantity');
        $quotes = $shipping->quote(['provider_area_id' => $warehouse->provider_area_id], ['provider_area_id' => $d['destination_area_id']], $weight, $quantity, $d['courier'] ?? null);
        $selected = collect($quotes)->first(fn ($q) => $q->service === $d['service']);
        abort_unless($selected instanceof ShippingQuote, 422, 'Selected shipping service is unavailable.');

        return response()->json(['data' => ['pricing' => $pricing->calculate($cart, $d['voucher_code'] ?? null, $selected->fee), 'shipping' => $selected->toArray()]]);
    }
}
