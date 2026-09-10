<?php

use App\Domain\Payment\HttpMidtransProvider;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);
beforeEach(function () {
    Http::preventStrayRequests();
    config(['services.midtrans.driver' => 'http', 'services.midtrans.server_key' => 'SB-Mid-server-test',
        'services.midtrans.snap_url' => 'https://app.sandbox.midtrans.com/snap/v1/transactions',
        'services.midtrans.api_url' => 'https://api.sandbox.midtrans.com/v2']);
});
it('blocks sandbox tools without sandbox credentials or with production endpoints', function () {
    config(['services.midtrans.api_url' => 'https://api.midtrans.com/v2']);
    $this->artisan('midtrans:sandbox-check')->assertFailed();
    $this->artisan('midtrans:sandbox-recover missing')->assertFailed();
    Http::assertNothingSent();
});
it('recovers a stale uncharged intent on the same order without exposing its token', function () {
    ['order' => $order] = payableOrder();
    $payment = Payment::create(['order_id' => $order->id, 'provider' => 'MIDTRANS', 'status' => 'PENDING', 'amount' => $order->grand_total, 'currency' => 'IDR', 'expires_at' => $order->expires_at, 'initialization_state' => 'uncertain']);
    $this->travel(3)->minutes();
    Http::fake(['*/status' => Http::response(['status_code' => '404'], 404), '*/transactions' => Http::response(['token' => 'recovered-secret', 'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/recovered-secret'], 201)]);
    $this->artisan('midtrans:sandbox-recover '.$order->order_number)->assertSuccessful();
    expect($payment->refresh()->snap_token)->toBe('recovered-secret')->and($payment->initialization_state)->toBe('ready');
    Http::assertSent(fn ($request) => $request->method() === 'POST' && $request['transaction_details']['order_id'] === $order->order_number);
    $this->assertDatabaseCount('payments', 1);
});
it('never recreates a token while initialization is recent or status lookup fails', function () {
    ['order' => $order] = payableOrder();
    Payment::create(['order_id' => $order->id, 'provider' => 'MIDTRANS', 'status' => 'PENDING', 'amount' => $order->grand_total, 'currency' => 'IDR', 'expires_at' => $order->expires_at, 'initialization_state' => 'creating']);
    Http::fake(['*/status' => Http::response(['status_code' => '404'], 404)]);
    $this->artisan('midtrans:sandbox-recover '.$order->order_number)->assertFailed();
    Http::assertNotSent(fn ($request) => $request->method() === 'POST');
    $this->travel(3)->minutes();
    Http::fake(['*/status' => Http::response([], 500)]);
    $this->artisan('midtrans:sandbox-recover '.$order->order_number)->assertFailed();
    Http::assertNotSent(fn ($request) => $request->method() === 'POST');
});
it('recovers paid status without creating a new token', function () {
    ['order' => $order] = payableOrder();
    Payment::create(['order_id' => $order->id, 'provider' => 'MIDTRANS', 'status' => 'PENDING', 'amount' => $order->grand_total, 'currency' => 'IDR', 'expires_at' => $order->expires_at, 'initialization_state' => 'uncertain']);
    Http::fake(['*/status' => Http::response(midtransPayload($order, 'settlement'))]);
    $this->artisan('midtrans:sandbox-recover '.$order->order_number)->assertSuccessful();
    expect($order->refresh()->getRawOriginal('status'))->toBe('PAID');
    Http::assertSentCount(1);
});

it('does not release a Snap session just because its last attempt was denied', function () {
    ['order' => $order] = payableOrder();
    Http::fake(['*/status' => Http::response(midtransPayload($order, 'deny'))]);
    expect(fn () => (new HttpMidtransProvider)->closeTransaction($order, 'cancel'))->toThrow(RuntimeException::class);
});
