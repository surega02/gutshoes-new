<?php

use App\Domain\Payment\MidtransProvider;
use App\Jobs\SendOrderEmail;
use App\Models\EmailDelivery;
use App\Models\Order;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

it('keeps release-critical routes represented by the OpenAPI contract', function () {
    $contract = file_get_contents(base_path('../../docs/api/openapi.yaml'));
    expect($contract)->toContain('/products:', '/orders:', '/guest/orders/{orderNumber}:', '/guest/orders/{orderNumber}/payment:', '/payments/midtrans/webhook:', '/orders/track:', '/admin/dashboard:');
    $routes = collect(Route::getRoutes()->getRoutes())->map(fn ($route) => $route->uri())->all();
    expect($routes)->toContain('api/v1/products', 'api/v1/orders', 'api/v1/guest/orders/{orderNumber}', 'api/v1/guest/orders/{orderNumber}/payment', 'api/v1/payments/midtrans/webhook', 'api/v1/orders/track', 'api/v1/admin/dashboard');
});

it('reports database and cache readiness without exposing credentials', function () {
    $this->getJson('/api/v1/health/ready')->assertOk()->assertJsonPath('data.status', 'ready')->assertJsonMissing(['password'])->assertJsonMissing(['secret']);
});

it('does not persist a partial payment when provider times out', function () {
    $this->app->bind(MidtransProvider::class, fn () => new class implements MidtransProvider
    {
        public function createSnapTransaction(Order $order): array
        {
            throw new RuntimeException('Provider timeout');
        }

        public function verifyWebhook(array $payload): bool
        {
            return true;
        }
    });
    $warehouse = Warehouse::factory()->create();
    $order = Order::create(['order_number' => 'GS-FAIL-0001', 'warehouse_id' => $warehouse->id, 'customer_email' => 'failure@example.test', 'customer_name' => 'Failure', 'customer_phone' => '08123',
        'status' => 'PENDING_PAYMENT', 'subtotal' => '100.00', 'product_discount' => '0.00', 'voucher_discount' => '0.00', 'shipping_fee' => '0.00', 'grand_total' => '100.00',
        'currency' => 'IDR', 'idempotency_key' => 'failure-key-00000001', 'payload_hash' => str_repeat('f', 64), 'expires_at' => now()->addDay()]);
    $this->postJson("/api/v1/orders/{$order->order_number}/payment", ['email' => $order->customer_email])->assertStatus(500);
    $this->assertDatabaseCount('payments', 0);
});

it('retries an order email without delivering it twice', function () {
    Mail::fake();
    $warehouse = Warehouse::factory()->create();
    $order = Order::create(['order_number' => 'GS-MAIL-0001', 'warehouse_id' => $warehouse->id, 'customer_email' => 'mail@example.test', 'customer_name' => 'Mail', 'customer_phone' => '08123',
        'status' => 'PAID', 'subtotal' => '100.00', 'product_discount' => '0.00', 'voucher_discount' => '0.00', 'shipping_fee' => '0.00', 'grand_total' => '100.00',
        'currency' => 'IDR', 'idempotency_key' => 'mail-key-0000000001', 'payload_hash' => str_repeat('e', 64), 'expires_at' => now()->addDay()]);
    $job = new SendOrderEmail($order->id, 'payment_success');
    $job->handle();
    $job->handle();
    expect(EmailDelivery::count())->toBe(1)->and(EmailDelivery::first()->attempts)->toBe(1);
});
