<?php

use App\Domain\Promotion\PricingService;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Voucher;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates an opaque guest cart token and reuses it', function () {
    $variant = ProductVariant::factory()->create(['price' => '100000.00']);
    $created = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])->assertCreated();
    $token = $created->json('data.guest_token');
    expect($token)->toBeString()->not->toBeEmpty();
    $this->withHeader('X-Guest-Cart-Token', $token)->getJson('/api/v1/cart')->assertOk()->assertJsonPath('data.items.0.quantity', 2);
});

it('applies only highest priority product discount then stacks one voucher', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'price' => '100000.00']);
    $cart = Cart::create(['guest_token' => '00000000-0000-4000-8000-000000000001', 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'quantity' => 2]);
    $low = Promotion::create(['name' => 'Low', 'type' => 'PERCENTAGE', 'value' => '10.00', 'priority' => 1, 'starts_at' => now()->subDay(), 'ends_at' => now()->addDay(), 'is_active' => true]);
    $low->products()->attach($product);
    $high = Promotion::create(['name' => 'High', 'type' => 'FIXED_AMOUNT', 'value' => '50000.00', 'priority' => 10, 'starts_at' => now()->subDay(), 'ends_at' => now()->addDay(), 'is_active' => true]);
    $high->products()->attach($product);
    Voucher::create(['code' => 'SAVE20', 'name' => 'Save 20', 'type' => 'PERCENTAGE', 'value' => '20.00', 'minimum_amount' => '100000.00', 'starts_at' => now()->subDay(), 'ends_at' => now()->addDay(), 'is_active' => true]);
    $result = app(PricingService::class)->calculate($cart, 'SAVE20', '20000.00');
    expect($result['subtotal'])->toBe('200000.00')->and($result['product_discount'])->toBe('50000.00')->and($result['voucher_discount'])->toBe('30000.00')->and($result['grand_total'])->toBe('140000.00');
});

it('calculates shipping and free shipping voucher from server data', function () {
    $warehouse = Warehouse::factory()->create(['provider_area_id' => 'origin']);
    $variant = ProductVariant::factory()->create(['price' => '150000.00', 'weight_grams' => 900]);
    $cart = Cart::create(['guest_token' => '00000000-0000-4000-8000-000000000002', 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'quantity' => 1]);
    Voucher::create(['code' => 'FREESHIP', 'name' => 'Free Shipping', 'type' => 'FREE_SHIPPING', 'value' => '0.00', 'minimum_amount' => '0.00', 'starts_at' => now()->subDay(), 'ends_at' => now()->addDay(), 'is_active' => true]);
    $this->withHeader('X-Guest-Cart-Token', $cart->guest_token)->postJson('/api/v1/checkout/quote', ['destination_area_id' => 'destination', 'courier' => 'jne', 'service' => 'REG', 'voucher_code' => 'FREESHIP'])
        ->assertOk()->assertJsonPath('data.pricing.shipping_fee', '20000.00')->assertJsonPath('data.pricing.voucher_discount', '20000.00')->assertJsonPath('data.pricing.grand_total', '150000.00');
});
