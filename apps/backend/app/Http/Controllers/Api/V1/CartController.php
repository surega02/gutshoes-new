<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cart\CartResolver;
use App\Domain\Promotion\PricingService;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartResolver $resolver, private PricingService $pricing) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->resolver->resolve($request);

        return response()->json(['data' => $this->payload($cart)]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $d = $request->validate(['variant_id' => ['required', 'integer', 'exists:product_variants,id'], 'quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        $variant = ProductVariant::where('is_active', true)->findOrFail($d['variant_id']);
        $cart = $this->resolver->resolve($request);
        $item = $cart->items()->firstOrNew(['product_variant_id' => $variant->id]);
        $item->quantity = min(20, ($item->quantity ?? 0) + $d['quantity']);
        $item->save();

        return response()->json(['data' => $this->payload($cart->refresh())], 201);
    }

    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolver->resolve($request, false);
        abort_unless($cart && $item->cart_id === $cart->id, 404);
        $d = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        $item->update($d);

        return response()->json(['data' => $this->payload($cart)]);
    }

    public function deleteItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolver->resolve($request, false);
        abort_unless($cart && $item->cart_id === $cart->id, 404);
        $item->delete();

        return response()->json(['data' => $this->payload($cart)]);
    }

    /** @return array<string,mixed> */
    private function payload(Cart $cart): array
    {
        $cart->load(['items.variant.size', 'items.variant.inventories', 'items.variant.product.brand', 'items.variant.product.images']);

        return ['guest_token' => $cart->guest_token, 'items' => $cart->items, 'pricing' => $this->pricing->calculate($cart, null)];
    }
}
