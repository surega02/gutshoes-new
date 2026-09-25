<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cart\CartResolver;
use App\Domain\Promotion\PricingService;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function __construct(private CartResolver $resolver, private PricingService $pricing) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->resolver->resolve($request);

        return response()->json(['data' => $this->payload($cart)]);
    }

    public function claim(Request $request): JsonResponse
    {
        $token = $request->header('X-Guest-Cart-Token');
        abort_unless(is_string($token) && $token !== '', 422);
        $cart = DB::transaction(function () use ($request, $token): Cart {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $guest = Cart::whereNull('user_id')->where('guest_token', $token)->where('status', 'ACTIVE')->lockForUpdate()->first();
            $customer = $this->resolver->resolve($request);
            $customer = Cart::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            if ($guest) {
                foreach ($guest->items()->lockForUpdate()->get() as $item) {
                    $target = $customer->items()->where('product_variant_id', $item->product_variant_id)->lockForUpdate()->first() ?? new CartItem(['product_variant_id' => $item->product_variant_id]);
                    $quantity = ($target->quantity ?? 0) + $item->quantity;
                    $this->ensureAvailableStock(ProductVariant::findOrFail($item->product_variant_id), $quantity);
                    $target->quantity = $quantity;
                    $customer->items()->save($target);
                }
                $guest->update(['status' => 'ABANDONED']);
            }

            return $customer;
        }, 3);

        return response()->json(['data' => $this->payload($cart)]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $d = $request->validate(['variant_id' => ['required', 'integer', 'exists:product_variants,id'], 'quantity' => ['required', 'integer', 'min:1']]);
        $variant = ProductVariant::where('is_active', true)->findOrFail($d['variant_id']);
        $cart = $this->resolver->resolve($request);

        return DB::transaction(function () use ($cart, $variant, $d): JsonResponse {
            $cart = Cart::whereKey($cart->id)->where('status', 'ACTIVE')->lockForUpdate()->firstOrFail();
            $item = $cart->items()->where('product_variant_id', $variant->id)->lockForUpdate()->first() ?? new CartItem(['product_variant_id' => $variant->id]);
            $quantity = ($item->quantity ?? 0) + $d['quantity'];
            $this->ensureAvailableStock($variant, $quantity);
            $item->quantity = $quantity;
            $cart->items()->save($item);

            return response()->json(['data' => $this->payload($cart->refresh())], 201);
        }, 3);
    }

    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolver->resolve($request, false);
        abort_unless($cart && $item->cart_id === $cart->id, 404);
        $d = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);

        return DB::transaction(function () use ($cart, $item, $d): JsonResponse {
            $cart = Cart::whereKey($cart->id)->where('status', 'ACTIVE')->lockForUpdate()->firstOrFail();
            $item = CartItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
            $variant = ProductVariant::findOrFail($item->product_variant_id);
            $this->ensureAvailableStock($variant, $d['quantity']);
            $item->update($d);

            return response()->json(['data' => $this->payload($cart)]);
        }, 3);
    }

    public function deleteItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->resolver->resolve($request, false);
        abort_unless($cart && $item->cart_id === $cart->id, 404);

        return DB::transaction(function () use ($cart, $item): JsonResponse {
            $cart = Cart::whereKey($cart->id)->where('status', 'ACTIVE')->lockForUpdate()->firstOrFail();
            $item->delete();

            return response()->json(['data' => $this->payload($cart)]);
        }, 3);
    }

    private function ensureAvailableStock(ProductVariant $variant, int $quantity): void
    {
        $available = (int) $variant->inventories()->lockForUpdate()->get()->sum(fn ($inventory): int => max(0, (int) $inventory->on_hand - (int) $inventory->reserved));
        if ($quantity > $available) {
            throw ValidationException::withMessages(['quantity' => ["Jumlah melebihi stok tersedia ({$available})."]]);
        }
    }

    /** @return array<string,mixed> */
    private function payload(Cart $cart): array
    {
        $cart->load(['items.variant.size', 'items.variant.inventories', 'items.variant.product.brand', 'items.variant.product.images']);

        return ['guest_token' => $cart->guest_token, 'items' => $cart->items, 'pricing' => $this->pricing->calculate($cart, null)];
    }
}
