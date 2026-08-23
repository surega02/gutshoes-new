<?php

use App\Enums\UserRole;
use App\Jobs\SendOrderEmail;
use App\Models\Order;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

function fulfillmentOrder(?User $user = null, string $status = 'PAID'): Order
{
    $warehouse = Warehouse::factory()->create();
    $order = Order::create(['order_number' => 'GS-FUL-'.fake()->unique()->numerify('######'), 'user_id' => $user?->id, 'warehouse_id' => $warehouse->id,
        'customer_email' => $user?->email ?? 'guest@example.test', 'customer_name' => 'Buyer', 'customer_phone' => '08123', 'status' => $status,
        'subtotal' => '100000.00', 'product_discount' => '0.00', 'voucher_discount' => '0.00', 'shipping_fee' => '20000.00',
        'grand_total' => '120000.00', 'currency' => 'IDR', 'idempotency_key' => fake()->uuid(), 'payload_hash' => str_repeat('b', 64), 'expires_at' => now()->addDay()]);
    $order->shipment()->create(['provider' => 'FAKE', 'courier' => 'jne', 'service' => 'REG', 'fee' => '20000.00', 'status' => 'PENDING', 'quote_snapshot' => []]);

    return $order;
}

it('only exposes customer order history to its owner', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $owned = fulfillmentOrder($owner);
    fulfillmentOrder($other);
    $this->actingAs($owner)->getJson('/api/v1/orders')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.order_number', $owned->order_number);
    $this->actingAs($other)->getJson("/api/v1/orders/{$owned->order_number}")->assertNotFound();
});

it('tracks a guest order only with matching order number and email', function () {
    $order = fulfillmentOrder();
    $this->postJson('/api/v1/orders/track', ['order_number' => $order->order_number, 'email' => 'wrong@example.test'])->assertNotFound();
    $this->postJson('/api/v1/orders/track', ['order_number' => $order->order_number, 'email' => $order->customer_email])->assertOk()->assertJsonPath('data.status', 'PAID');
});

it('guards fulfillment sequence and queues shipment lifecycle email', function () {
    Bus::fake();
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    $order = fulfillmentOrder();
    $url = "/api/v1/admin/orders/{$order->id}/fulfillment";
    $this->actingAs($admin)->patchJson($url, ['status' => 'SHIPPED', 'tracking_number' => 'RESI-1'])->assertStatus(422);
    $this->actingAs($admin)->patchJson($url, ['status' => 'PROCESSING'])->assertOk()->assertJsonPath('data.status', 'PROCESSING');
    $this->actingAs($admin)->patchJson($url, ['status' => 'SHIPPED', 'tracking_number' => 'RESI-1'])->assertOk()->assertJsonPath('data.shipment.tracking_number', 'RESI-1');
    $this->actingAs($admin)->patchJson($url, ['status' => 'DELIVERED'])->assertOk()->assertJsonPath('data.status', 'DELIVERED');
    Bus::assertDispatched(SendOrderEmail::class, 2);
});
