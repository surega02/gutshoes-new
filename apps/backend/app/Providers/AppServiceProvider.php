<?php

namespace App\Providers;

use App\Domain\Payment\FakeMidtransProvider;
use App\Domain\Payment\HttpMidtransProvider;
use App\Domain\Payment\MidtransProvider;
use App\Domain\Refund\FakeRefundProvider;
use App\Domain\Refund\HttpRefundProvider;
use App\Domain\Refund\RefundProvider;
use App\Domain\Shipping\BiteshipShippingAreaMapper;
use App\Domain\Shipping\BiteshipShippingProvider;
use App\Domain\Shipping\FakeShippingAreaMapper;
use App\Domain\Shipping\FakeShippingProvider;
use App\Domain\Shipping\NullShipmentTracker;
use App\Domain\Shipping\RajaOngkirShipmentTracker;
use App\Domain\Shipping\RajaOngkirShippingAreaMapper;
use App\Domain\Shipping\RajaOngkirShippingProvider;
use App\Domain\Shipping\ShipmentTracker;
use App\Domain\Shipping\ShippingAreaMapper;
use App\Domain\Shipping\ShippingProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(RefundProvider::class, fn () => config('services.midtrans.driver') === 'http'
            ? new HttpRefundProvider
            : new FakeRefundProvider);
        $this->app->bind(MidtransProvider::class, fn () => config('services.midtrans.driver') === 'http'
            ? new HttpMidtransProvider
            : new FakeMidtransProvider);
        $this->app->bind(ShippingProvider::class, fn () => match (config('gutshoes.shipping_driver')) {
            'biteship' => new BiteshipShippingProvider,
            'rajaongkir' => new RajaOngkirShippingProvider,
            default => new FakeShippingProvider,
        });
        $this->app->bind(ShippingAreaMapper::class, fn () => match (config('gutshoes.shipping_driver')) {
            'biteship' => new BiteshipShippingAreaMapper,
            'rajaongkir' => new RajaOngkirShippingAreaMapper,
            default => new FakeShippingAreaMapper,
        });
        $this->app->bind(ShipmentTracker::class, fn () => config('gutshoes.tracking_driver') === 'rajaongkir'
            ? new RajaOngkirShipmentTracker
            : new NullShipmentTracker);
    }

    public function boot(): void
    {
        RateLimiter::for('health', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->getAuthIdentifier() ?? $request->ip()));
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(10)
            ->by($request->user()?->getAuthIdentifier() ?? $request->ip()));
        RateLimiter::for('tracking', fn (Request $request) => Limit::perMinute(15)->by($request->ip()));
        RateLimiter::for('webhooks', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));
    }
}
