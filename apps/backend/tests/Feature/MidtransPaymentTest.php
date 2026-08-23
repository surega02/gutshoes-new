<?php

use App\Domain\Inventory\InventoryService;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhook;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function payableOrder(): array
{
    $warehouse = Warehouse::factory()->create(['provider_area_id' => 'origin']);
    $variant = ProductVariant::factory()->create();
    $inventory = Inventory::create(['warehouse_id' => $warehouse->id, 'product_variant_id' => $variant->id, 'on_hand' => 2, 'reserved' => 0, 'sold' => 0]);
    $order = Order::create(['order_number' => 'GS-TEST-'.fake()->unique()->numerify('######'), 'warehouse_id' => $warehouse->id,
        'customer_email' => 'buyer@example.test', 'customer_name' => 'Buyer', 'customer_phone' => '08123', 'status' => 'PENDING_PAYMENT',
        'subtotal' => '100000.00', 'product_discount' => '0.00', 'voucher_discount' => '0.00', 'shipping_fee' => '20000.00',
        'grand_total' => '120000.00', 'currency' => 'IDR', 'idempotency_key' => fake()->uuid(), 'payload_hash' => str_repeat('a', 64), 'expires_at' => now()->addDay()]);
    app(InventoryService::class)->reserve($inventory, $order, 1);

    return compact('order', 'inventory');
}

function midtransPayload(Order $order, string $status): array
{
    $payload = ['order_id' => $order->order_number, 'transaction_id' => 'mid-'.$order->id, 'transaction_status' => $status,
        'status_code' => '200', 'gross_amount' => '120000.00', 'transaction_time' => '2026-08-23 12:00:00'];
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].config('services.midtrans.server_key'));

    return $payload;
}

beforeEach(function () {
    config(['services.midtrans.driver' => 'fake', 'services.midtrans.server_key' => 'test-server-key']);
});

it('creates one reusable Snap payment for a payable order', function () {
    ['order' => $order] = payableOrder();
    $url = "/api/v1/orders/{$order->order_number}/payment";
    $first = $this->postJson($url, ['email' => $order->customer_email])->assertCreated();
    $this->postJson($url, ['email' => $order->customer_email])->assertCreated()->assertJsonPath('data.payment.snap_token', $first->json('data.payment.snap_token'));
    expect(Payment::count())->toBe(1);
});

it('rejects webhook before persisting when signature is invalid', function () {
    ['order' => $order] = payableOrder();
    $this->postJson("/api/v1/orders/{$order->order_number}/payment", ['email' => $order->customer_email])->assertCreated();
    $payload = midtransPayload($order, 'settlement');
    $payload['signature_key'] = 'invalid';
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertUnauthorized()->assertJsonPath('code', 'INVALID_WEBHOOK_SIGNATURE');
    expect(PaymentWebhook::count())->toBe(0);
});

it('processes success exactly once and ignores a later expiry event', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    $this->postJson("/api/v1/orders/{$order->order_number}/payment", ['email' => $order->customer_email])->assertCreated();
    $payload = midtransPayload($order, 'settlement');
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    $expiry = midtransPayload($order, 'expire');
    $expiry['transaction_time'] = '2026-08-24 12:00:00';
    $expiry['signature_key'] = hash('sha512', $expiry['order_id'].$expiry['status_code'].$expiry['gross_amount'].config('services.midtrans.server_key'));
    $this->postJson('/api/v1/payments/midtrans/webhook', $expiry)->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PAID')->and($inventory->refresh()->on_hand)->toBe(1)->and($inventory->reserved)->toBe(0)->and($inventory->sold)->toBe(1);
    expect(PaymentWebhook::count())->toBe(2);
    $this->assertDatabaseMissing('payment_webhooks', ['payload_redacted' => $payload['signature_key']]);
});
