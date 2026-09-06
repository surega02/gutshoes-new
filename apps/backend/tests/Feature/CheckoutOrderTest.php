<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
function orderRegion(string $province = 'DKI Jakarta', string $city = 'Jakarta Selatan'): array
{
    $p = $province === 'DKI Jakarta' ? '31' : '12';
    $r = "$p.01";
    $d = "$r.01";
    $v = "$d.2001";
    DB::table('region_provinces')->insertOrIgnore(['code' => $p, 'name' => $province]);
    DB::table('region_regencies')->insertOrIgnore(['code' => $r, 'province_code' => $p, 'name' => $city]);
    DB::table('region_districts')->insertOrIgnore(['code' => $d, 'regency_code' => $r, 'name' => 'Test']);
    DB::table('region_villages')->insertOrIgnore(['code' => $v, 'district_code' => $d, 'name' => 'Test', 'postal_code' => '12345']);

    return ['province_code' => $p, 'regency_code' => $r, 'district_code' => $d, 'village_code' => $v];
}

function checkoutFixture(int $stock = 3): array
{
    $warehouse = Warehouse::factory()->create(['provider_area_id' => 'origin']);
    $variant = ProductVariant::factory()->create(['price' => '150000.00', 'weight_grams' => 800]);
    $inventory = Inventory::create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => $stock, 'reserved' => 0, 'sold' => 0]);
    $cart = Cart::create(['guest_token' => fake()->uuid(), 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'quantity' => 2]);
    $payload = [
        'customer' => ['name' => 'Guest Buyer', 'email' => 'guest@example.test', 'phone' => '081234567890'],
        'address' => ['recipient_name' => 'Guest Buyer', 'phone' => '081234567890', 'address_line' => 'Jl. Contoh 1', 'postal_code' => '12345', 'provider_area_id' => 'destination'] + orderRegion(),
        'shipping' => ['courier' => 'jne', 'service' => 'REG'],
    ];

    return compact('cart', 'inventory', 'payload');
}

it('creates snapshots and reservations once for an idempotent checkout', function () {
    ['cart' => $cart, 'inventory' => $inventory, 'payload' => $payload] = checkoutFixture();
    $headers = ['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'checkout-key-00000001'];
    $first = $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertCreated();
    $number = $first->json('data.order_number');
    $token = $first->json('data.guest_access_token');
    expect($token)->toBeString()->and(strlen($token))->toBeGreaterThanOrEqual(32);
    $first->assertJsonPath('data.guest_order_url', fn ($url) => is_string($url) && str_contains($url, $number));
    $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertOk()
        ->assertJsonPath('data.order_number', $number)
        ->assertJsonPath('data.guest_access_token', $token);
    expect(Order::count())->toBe(1)->and($inventory->refresh()->reserved)->toBe(2);
    $this->assertDatabaseHas('order_items', ['order_id' => Order::first()->id, 'sku' => ProductVariant::first()->sku]);
    $this->assertDatabaseHas('order_addresses', ['order_id' => Order::first()->id, 'type' => 'SHIPPING']);
});

it('rejects reuse of an idempotency key with a different payload', function () {
    ['cart' => $cart, 'payload' => $payload] = checkoutFixture();
    $headers = ['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'checkout-key-00000002'];
    $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertCreated();
    $payload['customer']['name'] = 'Different Buyer';
    $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertStatus(409)->assertJsonPath('code', 'IDEMPOTENCY_CONFLICT');
    expect(Order::count())->toBe(1);
});

it('rolls back every checkout side effect when stock is insufficient', function () {
    ['cart' => $cart, 'payload' => $payload] = checkoutFixture(1);
    $this->withHeaders(['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'checkout-key-00000003'])
        ->postJson('/api/v1/orders', $payload)->assertStatus(422);
    expect(Order::count())->toBe(0);
    $this->assertDatabaseCount('inventory_reservations', 0)->assertDatabaseCount('order_items', 0);
});
it('recalculates regional shipping per item when creating the order', function () {
    ['cart' => $cart, 'payload' => $payload] = checkoutFixture();
    $payload['address'] = array_replace($payload['address'], orderRegion('Sumatera Utara', 'Medan'));
    $created = $this->withHeaders(['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'checkout-key-regional-01'])
        ->postJson('/api/v1/orders', $payload)->assertCreated()
        ->assertJsonPath('data.shipping_fee', '60000.00');
    expect($created->json('data.shipment.provider'))->toBe('GUTSHOES_REGIONAL')
        ->and($created->json('data.shipment.service'))->toBe('REGIONAL_PER_ITEM');
});
