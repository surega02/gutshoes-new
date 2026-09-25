<?php

use App\Domain\Promotion\PricingService;
use App\Domain\Shipping\RegionAddressResolver;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Voucher;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);
function cartRegion(string $province, string $city): array
{
    static $i = 40;
    $i++;
    $p = (string) $i;
    $r = "$p.01";
    $d = "$r.01";
    $v = "$d.2001";
    DB::table('region_provinces')->insert(['code' => $p, 'name' => $province]);
    DB::table('region_regencies')->insert(['code' => $r, 'province_code' => $p, 'name' => $city]);
    DB::table('region_districts')->insert(['code' => $d, 'regency_code' => $r, 'name' => 'Test']);
    DB::table('region_villages')->insert(['code' => $v, 'district_code' => $d, 'name' => 'Test', 'postal_code' => '12345']);

    return ['province_code' => $p, 'regency_code' => $r, 'district_code' => $d, 'village_code' => $v];
}

it('creates an opaque guest cart token and reuses it', function () {
    $variant = ProductVariant::factory()->create(['price' => '100000.00']);
    Inventory::factory()->create(['product_variant_id' => $variant->id, 'on_hand' => 5, 'reserved' => 1]);
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
    $this->withHeader('X-Guest-Cart-Token', $cart->guest_token)->postJson('/api/v1/checkout/quote', ['destination_area_id' => 'destination', 'courier' => 'jne', 'service' => 'REG', 'voucher_code' => 'FREESHIP'] + cartRegion('DKI Jakarta', 'Jakarta Selatan'))
        ->assertOk()->assertJsonPath('data.pricing.shipping_fee', '20000.00')->assertJsonPath('data.pricing.voucher_discount', '20000.00')->assertJsonPath('data.pricing.grand_total', '150000.00');
});
it('uses the configured provider for destinations outside Jabodetabek', function () {
    Warehouse::factory()->create(['provider_area_id' => 'origin']);
    $variant = ProductVariant::factory()->create(['price' => '150000.00', 'weight_grams' => 900]);
    $cart = Cart::create(['guest_token' => fake()->uuid(), 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'quantity' => 2]);

    $this->withHeader('X-Guest-Cart-Token', $cart->guest_token)
        ->postJson('/api/v1/checkout/quote', ['service' => 'REG'] + cartRegion('Sumatera Utara', 'Medan'))
        ->assertOk()
        ->assertJsonPath('data.shipping.provider', 'FAKE')
        ->assertJsonPath('data.pricing.shipping_fee', '20000.00');
});

it('limits cart quantity using available stock instead of a fixed cap', function () {
    $variant = ProductVariant::factory()->create();
    Inventory::factory()->create(['product_variant_id' => $variant->id, 'on_hand' => 40, 'reserved' => 5]);

    $created = $this->postJson('/api/v1/cart/items', ['variant_id' => $variant->id, 'quantity' => 30])
        ->assertCreated()
        ->assertJsonPath('data.items.0.quantity', 30);

    $this->withHeader('X-Guest-Cart-Token', $created->json('data.guest_token'))
        ->patchJson('/api/v1/cart/items/'.$created->json('data.items.0.id'), ['quantity' => 36])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('quantity');
});

it('maps internal regions to the provider area id on the server', function () {
    config(['gutshoes.shipping_driver' => 'biteship', 'services.biteship.api_key' => 'secret']);
    Http::fake(['*/v1/maps/areas*' => Http::response(['areas' => [['id' => 'ID-BITESHIP-12345', 'postal_code' => 12345, 'administrative_division_level_3_name' => 'Test']]])]);
    $address = app(RegionAddressResolver::class)->resolve(cartRegion('DKI Jakarta', 'Jakarta Selatan') + [
        'postal_code' => '12345',
        'provider_area_id' => 'client-value-must-not-be-used',
    ]);

    expect($address['provider_area_id'])->toBe('ID-BITESHIP-12345');
    Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'secret') && str_contains($request->url(), '/v1/maps/areas'));
});
