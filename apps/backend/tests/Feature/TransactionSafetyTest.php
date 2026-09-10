<?php

use App\Domain\Inventory\InventoryService;
use App\Domain\Payment\CreatePaymentService;
use App\Domain\Payment\FakeMidtransProvider;
use App\Domain\Payment\HttpMidtransProvider;
use App\Domain\Payment\MidtransProvider;
use App\Jobs\ExpirePendingOrders;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['services.midtrans.driver' => 'fake', 'services.midtrans.server_key' => 'test-server-key']);
    Http::preventStrayRequests();
});

it('does not authorize payment or cancellation with email alone', function (string $action) {
    ['order' => $order] = payableOrder();
    $this->withHeaders(['X-Guest-Order-Token' => '', 'Idempotency-Key' => 'security-check-0001'])
        ->postJson("/api/v1/orders/{$order->order_number}/{$action}", ['email' => $order->customer_email, 'reason' => 'Cancel'])
        ->assertNotFound();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PENDING_PAYMENT');
    $this->assertDatabaseCount('payments', 0)->assertDatabaseCount('order_cancellations', 0);
})->with(['payment', 'cancel']);

it('rejects another customer and an old guest credential after order linking', function () {
    ['order' => $order] = payableOrder();
    $owner = User::factory()->create();
    $order->update(['user_id' => $owner->id]);
    $this->postJson("/api/v1/orders/{$order->order_number}/payment")->assertNotFound();
    $this->actingAs(User::factory()->create())->postJson("/api/v1/orders/{$order->order_number}/payment")->assertNotFound();
    $this->actingAs($owner)->withHeader('X-Guest-Order-Token', '')->postJson("/api/v1/orders/{$order->order_number}/payment")->assertCreated();
});

it('allows a guest token and makes repeated cancellation harmless', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    $this->withHeader('Idempotency-Key', 'cancel-safe-repeat-0001');
    $url = "/api/v1/orders/{$order->order_number}/cancel";
    $this->postJson($url, ['reason' => 'Changed mind'])->assertCreated();
    $this->postJson($url, ['reason' => 'Changed mind'])->assertCreated();
    expect($inventory->refresh()->reserved)->toBe(0);
    $this->assertDatabaseCount('order_cancellations', 1)->assertDatabaseCount('refunds', 0);
});

it('records the admin and target when cancelling through the common route', function () {
    ['order' => $order] = payableOrder();
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->withHeader('Idempotency-Key', 'admin-cancel-00000001')
        ->postJson("/api/v1/orders/{$order->order_number}/cancel", ['reason' => 'Customer requested'])->assertCreated();
    $this->assertDatabaseHas('audit_logs', ['admin_id' => $admin->id, 'entity_type' => Order::class, 'entity_id' => $order->id, 'action' => 'cancel']);
});

it('checks out a session cart without a guest token and fixes the identity email', function () {
    ['cart' => $cart, 'payload' => $payload] = checkoutFixture();
    $owner = User::factory()->create();
    $cart->update(['user_id' => $owner->id, 'guest_token' => null]);
    $this->actingAs($owner)->getJson('/api/v1/cart')->assertOk()->assertJsonPath('data.guest_token', null)->assertJsonCount(1, 'data.items');
    $this->withHeader('Idempotency-Key', 'owner-checkout-000001')->postJson('/api/v1/orders', $payload)
        ->assertCreated()->assertJsonPath('data.user_id', $owner->id)->assertJsonPath('data.customer_email', $owner->email)->assertJsonMissingPath('data.guest_access_token');
    $this->postJson('/api/v1/orders', $payload)->assertOk();
    $this->assertDatabaseCount('orders', 1);
});

it('does not reveal an order when another cart reuses its idempotency key', function () {
    ['cart' => $cart, 'inventory' => $inventory, 'payload' => $payload] = checkoutFixture(6);
    $key = 'shared-client-key-0001';
    $first = $this->withHeaders(['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => $key])->postJson('/api/v1/orders', $payload)->assertCreated();
    $other = Cart::create(['guest_token' => fake()->uuid(), 'status' => 'ACTIVE']);
    CartItem::create(['cart_id' => $other->id, 'product_variant_id' => $inventory->product_variant_id, 'quantity' => 2]);
    $second = $this->withHeader('X-Guest-Cart-Token', $other->guest_token)->postJson('/api/v1/orders', $payload)->assertCreated();
    expect($second->json('data.order_number'))->not->toBe($first->json('data.order_number'));
    expect($second->json('data.guest_access_token'))->not->toBe($first->json('data.guest_access_token'));
});

it('uses the order deadline when Snap initialization is delayed', function () {
    ['order' => $order] = payableOrder();
    $deadline = $order->expires_at->copy();
    $this->travel(2)->hours();
    Http::fake(['*' => Http::response(['token' => 'snap-test', 'redirect_url' => 'https://example.test/pay'])]);
    (new HttpMidtransProvider)->createSnapTransaction($order);
    Http::assertSent(fn ($request) => $request['expiry']['start_time'] === $deadline->copy()->subHours(24)->format('Y-m-d H:i:s O') && $request['expiry']['duration'] === 24);
});

it('does not create a token from a stale payable order model', function () {
    ['order' => $order] = payableOrder();
    Order::whereKey($order->id)->update(['status' => 'CANCELLED']);
    expect(fn () => app(CreatePaymentService::class)->create($order))->toThrow(DomainException::class);
    $this->assertDatabaseCount('payments', 0);
});

it('does not initialize twice after an ambiguous provider timeout', function () {
    ['order' => $order] = payableOrder();
    $provider = new class extends FakeMidtransProvider
    {
        public int $calls = 0;

        public function createSnapTransaction(Order $order): array
        {
            $this->calls++;
            throw new RuntimeException('Lost response');
        }
    };
    $service = new CreatePaymentService($provider);
    expect(fn () => $service->create($order))->toThrow(RuntimeException::class);
    expect(fn () => $service->create($order))->toThrow(ValidationException::class);
    expect($provider->calls)->toBe(1);
    $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'initialization_state' => 'uncertain']);
});

it('retains stock when payment closure times out', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $this->app->bind(MidtransProvider::class, fn () => new class extends FakeMidtransProvider
    {
        public function closeTransaction(Order $order, string $action): array
        {
            throw new RuntimeException('Timeout');
        }
    });
    $this->withHeader('Idempotency-Key', 'timeout-cancel-000001')->postJson("/api/v1/orders/{$order->order_number}/cancel", ['reason' => 'Cancel'])->assertStatus(500);
    expect($order->refresh()->getRawOriginal('status'))->toBe('PENDING_PAYMENT');
    expect($inventory->refresh()->reserved)->toBe(1);
});

it('reconciles payment that won the race against expiry', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $order->update(['expires_at' => now()->subMinute()]);
    $this->app->bind(MidtransProvider::class, fn () => new class extends FakeMidtransProvider
    {
        public function closeTransaction(Order $order, string $action): array
        {
            return midtransPayload($order, 'settlement');
        }
    });
    (new ExpirePendingOrders)->handle(app(InventoryService::class));
    expect($order->refresh()->getRawOriginal('status'))->toBe('PAID');
    expect($inventory->refresh()->reserved)->toBe(0)->and($inventory->sold)->toBe(1);
});

it('reconciles late settlement into one refund without selling released stock', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $order->update(['expires_at' => now()->subMinute()]);
    (new ExpirePendingOrders)->handle(app(InventoryService::class));
    $payload = midtransPayload($order, 'settlement');
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('EXPIRED');
    expect($inventory->refresh()->on_hand)->toBe(2)->and($inventory->sold)->toBe(0)->and($inventory->reserved)->toBe(0);
    $this->assertDatabaseCount('refunds', 1)->assertDatabaseHas('refunds', ['status' => 'PENDING']);
});

it('does not mark paid when reservations are missing', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    app(InventoryService::class)->release(InventoryReservation::where('order_id', $order->id)->first());
    $this->postJson('/api/v1/payments/midtrans/webhook', midtransPayload($order, 'settlement'))->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('CANCELLED');
    expect($inventory->refresh()->sold)->toBe(0);
    expect(Refund::count())->toBe(1);
});

it('rejects a signed amount mismatch without consuming stock', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $payload = midtransPayload($order, 'settlement');
    $payload['gross_amount'] = '1.00';
    $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].config('services.midtrans.server_key'));
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertStatus(422);
    expect($inventory->refresh()->reserved)->toBe(1)->and($inventory->sold)->toBe(0);
});

it('processes fraud acceptance even when a challenged capture was already logged', function () {
    ['order' => $order] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $payload = midtransPayload($order, 'capture');
    $payload['fraud_status'] = 'challenge';
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PENDING_PAYMENT');
    $payload['fraud_status'] = 'accept';
    $this->postJson('/api/v1/payments/midtrans/webhook', $payload)->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PAID');
});

it('keeps stock after a failed Snap attempt so another method can succeed', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    $this->postJson('/api/v1/payments/midtrans/webhook', midtransPayload($order, 'failure'))->assertOk();
    expect($inventory->refresh()->reserved)->toBe(1);
    expect($order->refresh()->getRawOriginal('status'))->toBe('PENDING_PAYMENT');
    $this->postJson('/api/v1/payments/midtrans/webhook', midtransPayload($order, 'settlement'))->assertOk();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PAID');
});

it('closes a charged transaction and verifies its final status', function () {
    ['order' => $order] = payableOrder();
    Http::fake(['*/status' => Http::sequence()->push(['transaction_status' => 'pending'])->push(midtransPayload($order, 'cancel')),
        '*/cancel' => Http::response(['status_code' => '200'])]);
    $result = (new HttpMidtransProvider)->closeTransaction($order, 'cancel');
    expect($result['transaction_status'])->toBe('cancel');
    Http::assertSentCount(3);
});

it('cancels an uncharged Snap session before allowing release', function () {
    ['order' => $order] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    Http::fake(['*/status' => Http::response(['status_code' => '404'], 404),
        '*snap/v1/transactions/*/cancel' => Http::response(['canceled_at' => now()->toIso8601String()])]);
    expect((new HttpMidtransProvider)->closeTransaction($order, 'cancel')['transaction_status'])->toBe('cancel');
    Http::assertSentCount(3);
});

it('claims a guest cart once and revokes access to its former items', function () {
    ['cart' => $guest, 'payload' => $payload] = checkoutFixture();
    $owner = User::factory()->create();
    $this->actingAs($owner)->withHeader('X-Guest-Cart-Token', $guest->guest_token)
        ->postJson('/api/v1/cart/claim')->assertOk()->assertJsonPath('data.guest_token', null)->assertJsonPath('data.items.0.quantity', 2);
    $this->postJson('/api/v1/cart/claim')->assertOk()->assertJsonPath('data.items.0.quantity', 2);
    expect($guest->refresh()->status)->toBe('ABANDONED');
    expect(Cart::where('user_id', $owner->id)->where('status', 'ACTIVE')->count())->toBe(1);
});

it('does not let another customer cancel an owned order with a guest token', function () {
    ['order' => $order] = payableOrder();
    $owner = User::factory()->create();
    $order->update(['user_id' => $owner->id]);
    $this->actingAs(User::factory()->create())->withHeader('Idempotency-Key', 'other-owner-00000001')
        ->postJson("/api/v1/orders/{$order->order_number}/cancel", ['reason' => 'Cancel'])->assertNotFound();
    $this->actingAs($owner)->postJson("/api/v1/orders/{$order->order_number}/cancel", ['reason' => 'Cancel'])->assertCreated();
});

it('continues expiry for other orders when one provider lookup fails', function () {
    ['order' => $blocked, 'inventory' => $reserved] = payableOrder();
    app(CreatePaymentService::class)->create($blocked);
    $blocked->update(['expires_at' => now()->subMinute()]);
    ['order' => $other, 'inventory' => $released] = payableOrder();
    $other->update(['expires_at' => now()->subMinute()]);
    $this->app->bind(MidtransProvider::class, fn () => new class extends FakeMidtransProvider
    {
        public function closeTransaction(Order $order, string $action): array
        {
            throw new RuntimeException('Unavailable');
        }
    });
    (new ExpirePendingOrders)->handle(app(InventoryService::class));
    expect($blocked->refresh()->getRawOriginal('status'))->toBe('PENDING_PAYMENT');
    expect($reserved->refresh()->reserved)->toBe(1);
    expect($other->refresh()->getRawOriginal('status'))->toBe('EXPIRED');
    expect($released->refresh()->reserved)->toBe(0);
});

it('returns actual customer order details including refund state', function () {
    ['order' => $order] = payableOrder();
    $owner = User::factory()->create();
    $order->update(['user_id' => $owner->id]);
    $this->actingAs($owner)->getJson("/api/v1/orders/{$order->order_number}")->assertOk()
        ->assertJsonPath('data.order_number', $order->order_number)->assertJsonPath('data.refunds', []);
    $this->actingAs(User::factory()->create())->getJson("/api/v1/orders/{$order->order_number}")->assertNotFound();
});

it('rejects cart item mutation after checkout converted that cart', function () {
    ['cart' => $cart, 'payload' => $payload] = checkoutFixture();
    $item = $cart->items()->first();
    $this->withHeaders(['X-Guest-Cart-Token' => $cart->guest_token, 'Idempotency-Key' => 'converted-cart-000001'])
        ->postJson('/api/v1/orders', $payload)->assertCreated();
    $this->patchJson('/api/v1/cart/items/'.$item->id, ['quantity' => 1])->assertNotFound();
    $this->deleteJson('/api/v1/cart/items/'.$item->id)->assertNotFound();
    expect($item->refresh()->quantity)->toBe(2);
});

it('commits reconciliation when cancellation discovers paid money after stock release', function () {
    ['order' => $order, 'inventory' => $inventory] = payableOrder();
    app(CreatePaymentService::class)->create($order);
    app(InventoryService::class)->release(InventoryReservation::where('order_id', $order->id)->first());
    $this->app->bind(MidtransProvider::class, fn () => new class extends FakeMidtransProvider
    {
        public function closeTransaction(Order $order, string $action): array
        {
            return midtransPayload($order, 'settlement');
        }
    });
    $this->withHeader('Idempotency-Key', 'cancel-paid-release-001');
    $url = "/api/v1/orders/{$order->order_number}/cancel";
    $this->postJson($url, ['reason' => 'Cancel'])->assertCreated();
    $this->postJson($url, ['reason' => 'Cancel'])->assertCreated();
    expect($order->refresh()->getRawOriginal('status'))->toBe('CANCELLED');
    expect($order->payment->paid_at)->not->toBeNull();
    expect($inventory->refresh()->sold)->toBe(0);
    $this->assertDatabaseCount('refunds', 1)->assertDatabaseCount('order_cancellations', 1);
});
