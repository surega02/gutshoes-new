<?php

use App\Domain\Order\GuestOrderAccess;
use App\Models\Order;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function guestRecoveryOrder(array $overrides = []): array
{
    $warehouse = Warehouse::factory()->create();
    $order = Order::create(array_replace([
        'order_number' => 'GS-GUEST-'.fake()->unique()->numerify('######'),
        'warehouse_id' => $warehouse->id,
        'customer_email' => 'guest@example.test',
        'customer_name' => 'Guest Buyer',
        'customer_phone' => '08123456789',
        'status' => 'PENDING_PAYMENT',
        'subtotal' => '100000.00',
        'product_discount' => '0.00',
        'voucher_discount' => '0.00',
        'shipping_fee' => '20000.00',
        'grand_total' => '120000.00',
        'currency' => 'IDR',
        'idempotency_key' => fake()->uuid(),
        'payload_hash' => str_repeat('a', 64),
        'expires_at' => now()->addDay(),
    ], $overrides));
    $order->items()->create([
        'product_name' => 'GutShoes Runner',
        'brand_name' => 'GutShoes',
        'sku' => 'GS-RUN-42',
        'size_label' => '42',
        'unit_price' => '100000.00',
        'discount_amount' => '0.00',
        'quantity' => 1,
        'line_total' => '100000.00',
        'weight_grams' => 800,
    ]);
    $token = app(GuestOrderAccess::class)->issue($order);

    return compact('order', 'token');
}

beforeEach(function () {
    config([
        'services.midtrans.driver' => 'fake',
        'services.midtrans.server_key' => 'test-server-key',
        'services.storefront.url' => 'https://shop.example.test',
    ]);
});

it('requires the guest order token and returns a safe payable snapshot', function () {
    ['order' => $order, 'token' => $token] = guestRecoveryOrder();
    $url = "/api/v1/guest/orders/{$order->order_number}";

    $this->getJson($url)->assertNotFound();
    $this->withHeader('X-Guest-Order-Token', 'wrong-token-that-is-long-enough-for-validation')->getJson($url)->assertNotFound();
    $this->withHeader('X-Guest-Order-Token', $token)->getJson($url)
        ->assertOk()
        ->assertJsonPath('data.order_number', $order->order_number)
        ->assertJsonPath('data.payment_status', 'NOT_STARTED')
        ->assertJsonPath('data.can_pay', true)
        ->assertJsonMissing(['customer_email', 'guest_access_token', 'guest_access_token_hash']);
});

it('reuses Midtrans payment through an authorized guest endpoint', function () {
    ['order' => $order, 'token' => $token] = guestRecoveryOrder();
    $url = "/api/v1/guest/orders/{$order->order_number}/payment";
    $headers = ['X-Guest-Order-Token' => $token];

    $first = $this->withHeaders($headers)->postJson($url)->assertCreated();
    $this->withHeaders($headers)->postJson($url)->assertCreated()
        ->assertJsonPath('data.payment.snap_token', $first->json('data.payment.snap_token'))
        ->assertJsonPath('data.order.payment_status', 'PENDING');
    $this->assertDatabaseCount('payments', 1);
});

it('does not offer or create payment for an expired guest order', function () {
    ['order' => $order, 'token' => $token] = guestRecoveryOrder(['expires_at' => now()->subMinute()]);
    $headers = ['X-Guest-Order-Token' => $token];

    $this->withHeaders($headers)->getJson("/api/v1/guest/orders/{$order->order_number}")
        ->assertOk()->assertJsonPath('data.can_pay', false);
    $this->withHeaders($headers)->postJson("/api/v1/guest/orders/{$order->order_number}/payment")
        ->assertStatus(422);
    $this->assertDatabaseCount('payments', 0);
});

it('stores only encrypted and hashed guest credentials at rest', function () {
    ['order' => $order, 'token' => $token] = guestRecoveryOrder();

    $raw = DB::table('orders')->where('id', $order->id)->first();
    expect($raw->guest_access_token)->not->toBe($token)
        ->and($raw->guest_access_token_hash)->toBe(hash('sha256', $token));
});
