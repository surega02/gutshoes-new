<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function checkoutFixture(int $stock = 3): array
{
    $warehouse = Warehouse::factory()->create(['provider_area_id' => 'origin']);
    $variant = ProductVariant::factory()->create(['price' => '150000.00', 'weight_grams' => 800]);
    $inventory = Inventory::create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => $stock, 'reserved' => 0, 'sold' => 0]);
    $cart = Cart::create(['guest_token' => fake()->uuid(), 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $cart->id, 'product_variant_id' => $variant->id, 'quantity' => 2]);
    $payload = [
        'customer' => ['name' => 'Guest Buyer', 'email' => 'guest@example.test', 'phone' => '081234567890'],
        'address' => ['recipient_name' => 'Guest Buyer', 'phone' => '081234567890', 'address_line' => 'Jl. Contoh 1', 'province' => 'DKI Jakarta', 'city' => 'Jakarta', 'district' => 'Setiabudi', 'postal_code' => '12910', 'provider_area_id' => 'destination'],
        'shipping' => ['courier' => 'jne', 'service' => 'REG'],
    ];

    return compact('cart', 'inventory', 'payload');
}

it('creates snapshots and reservations once for an idempotent checkout', function () {
    ['cart' => $cart, 'inventory' => $inventory, 'payload' => $payload] = checkoutFixture();
    $headers = ['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'checkout-key-00000001'];
    $first = $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertCreated();
    $number = $first->json('data.order_number');
    $this->withHeaders($headers)->postJson('/api/v1/orders', $payload)->assertOk()->assertJsonPath('data.order_number', $number);
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
        ->postJson('/api/v1/orders', $payload)->assertStatus(500);
    expect(Order::count())->toBe(0);
    $this->assertDatabaseCount('inventory_reservations', 0)->assertDatabaseCount('order_items', 0);
});
