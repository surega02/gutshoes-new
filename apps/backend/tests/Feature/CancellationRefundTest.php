<?php

use App\Domain\Inventory\InventoryService;
use App\Domain\Order\GuestOrderAccess;
use App\Enums\UserRole;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\Refund;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function cancellableOrder(string $status): array
{
    $warehouse = Warehouse::factory()->create();
    $variant = ProductVariant::factory()->create();
    $inventory = Inventory::create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => 2, 'reserved' => 0, 'sold' => 0]);
    $order = Order::create(['order_number' => 'GS-CAN-'.fake()->unique()->numerify('######'), 'warehouse_id' => $warehouse->id,
        'customer_email' => 'cancel@example.test', 'customer_name' => 'Buyer', 'customer_phone' => '08123', 'status' => $status,
        'subtotal' => '100000.00', 'product_discount' => '0.00', 'voucher_discount' => '0.00', 'shipping_fee' => '20000.00', 'grand_total' => '120000.00',
        'currency' => 'IDR', 'idempotency_key' => fake()->uuid(), 'payload_hash' => str_repeat('c', 64), 'expires_at' => now()->addDay()]);
    if ($status === 'PENDING_PAYMENT') {
        app(InventoryService::class)->reserve($inventory, $order, 1);
    }
    if ($status === 'PAID') {
        Payment::create(['order_id' => $order->id, 'provider' => 'MIDTRANS', 'provider_transaction_id' => 'mid-'.$order->id, 'status' => 'SETTLEMENT',
            'amount' => '120000.00', 'currency' => 'IDR', 'expires_at' => now()->addDay(), 'paid_at' => now()]);
    }

    app(GuestOrderAccess::class)->issue($order);
    test()->withHeader('X-Guest-Order-Token', $order->guest_access_token);

    return compact('order', 'inventory');
}

it('cancels unpaid orders and releases reservation exactly once', function () {
    ['order' => $order, 'inventory' => $inventory] = cancellableOrder('PENDING_PAYMENT');
    $headers = ['Idempotency-Key' => 'cancel-key-00000001'];
    $payload = ['email' => $order->customer_email, 'reason' => 'Changed mind'];
    $this->withHeaders($headers)->postJson("/api/v1/orders/{$order->order_number}/cancel", $payload)->assertCreated();
    $this->withHeaders($headers)->postJson("/api/v1/orders/{$order->order_number}/cancel", $payload)->assertCreated();
    expect($order->refresh()->getRawOriginal('status'))->toBe('CANCELLED')->and($inventory->refresh()->reserved)->toBe(0);
    $this->assertDatabaseCount('refunds', 0);
});

it('creates and processes one idempotent refund for a paid cancellation', function () {
    ['order' => $order] = cancellableOrder('PAID');
    $this->withHeader('Idempotency-Key', 'refund-key-00000001')->postJson("/api/v1/orders/{$order->order_number}/cancel", ['email' => $order->customer_email, 'reason' => 'Duplicate purchase'])->assertCreated()->assertJsonPath('data.refund.status', 'PENDING');
    $refund = Refund::first();
    $admin = User::factory()->create(['role' => UserRole::ADMIN]);
    $url = "/api/v1/admin/refunds/{$refund->id}/process";
    $this->actingAs($admin)->postJson($url)->assertOk()->assertJsonPath('data.status', 'SUCCESS');
    $this->actingAs($admin)->postJson($url)->assertOk()->assertJsonPath('data.provider_refund_id', 'fake-refund-'.$refund->id);
    expect(Refund::count())->toBe(1);
});

it('rejects cancellation for every fulfillment state', function (string $status) {
    ['order' => $order] = cancellableOrder($status);
    $this->withHeader('Idempotency-Key', 'blocked-'.$status.'-000001')->postJson("/api/v1/orders/{$order->order_number}/cancel", ['email' => $order->customer_email, 'reason' => 'Too late'])->assertStatus(422);
    expect($order->refresh()->getRawOriginal('status'))->toBe($status);
})->with(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED']);
