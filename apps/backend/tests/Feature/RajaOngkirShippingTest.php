<?php

use App\Domain\Shipping\RajaOngkirShipmentTracker;
use App\Domain\Shipping\RajaOngkirShippingAreaMapper;
use App\Domain\Shipping\RajaOngkirShippingProvider;
use Illuminate\Support\Facades\Http;

it('maps an internal address to exactly one RajaOngkir destination', function () {
    config(['services.rajaongkir.url' => 'https://rajaongkir.test/api/v1', 'services.rajaongkir.api_key' => 'secret']);
    Http::fake(['rajaongkir.test/*' => Http::response(['data' => [[
        'id' => 68513,
        'province_name' => 'Jawa Tengah',
        'city_name' => 'Purbalingga',
        'district_name' => 'Karangmoncol',
        'subdistrict_name' => 'Baleraksa',
        'zip_code' => '53355',
    ]]])]);

    $id = (new RajaOngkirShippingAreaMapper)->map([
        'province' => 'Jawa Tengah', 'city' => 'Purbalingga', 'district' => 'Karangmoncol',
        'village' => 'Baleraksa', 'postal_code' => '53355',
    ], 'internal-code');

    expect($id)->toBe('68513');
    Http::assertSent(fn ($request) => $request->hasHeader('key', 'secret')
        && str_contains($request->url(), '/destination/domestic-destination'));
});

it('rejects ambiguous RajaOngkir destination mapping', function () {
    config(['services.rajaongkir.url' => 'https://rajaongkir.test/api/v1']);
    $candidate = ['id' => 1, 'district_name' => 'Kecamatan', 'zip_code' => '12345'];
    Http::fake(['rajaongkir.test/*' => Http::response(['data' => [$candidate, $candidate + ['id' => 2]]])]);

    expect(fn () => (new RajaOngkirShippingAreaMapper)->map(['district' => 'Kecamatan', 'postal_code' => '12345'], 'internal'))
        ->toThrow(DomainException::class);
});

it('normalizes RajaOngkir rates behind the shipping contract', function () {
    config([
        'services.rajaongkir.url' => 'https://rajaongkir.test/api/v1',
        'services.rajaongkir.api_key' => 'secret',
        'services.rajaongkir.couriers' => 'jne:sicepat',
    ]);
    Http::fake(['rajaongkir.test/*' => Http::response(['data' => [[
        'name' => 'Jalur Nugraha Ekakurir', 'code' => 'jne', 'service' => 'REG',
        'description' => 'Layanan Reguler', 'cost' => 18000, 'etd' => '2-3 day',
    ]]])]);

    $quotes = (new RajaOngkirShippingProvider)->quote(
        ['provider_area_id' => '10'], ['provider_area_id' => '20'], 1800, 2,
    );

    expect($quotes)->toHaveCount(1)
        ->and($quotes[0]->provider)->toBe('RAJAONGKIR')
        ->and($quotes[0]->courier)->toBe('jne')
        ->and($quotes[0]->fee)->toBe('18000.00')
        ->and($quotes[0]->estimatedDays)->toBe(3);
    Http::assertSent(fn ($request) => $request->data()['origin'] === '10'
        && $request->data()['destination'] === '20'
        && $request->data()['weight'] === 1800
        && $request->data()['courier'] === 'jne:sicepat');
});

it('normalizes RajaOngkir AWB tracking without exposing the raw provider payload', function () {
    config(['services.rajaongkir.url' => 'https://rajaongkir.test/api/v1', 'services.rajaongkir.api_key' => 'secret']);
    Http::fake(['rajaongkir.test/*' => Http::response(['data' => [
        'delivered' => false,
        'summary' => ['status' => 'IN TRANSIT', 'waybill_number' => 'AWB-1'],
        'manifest' => [['manifest_description' => 'Paket diterima kurir']],
        'delivery_status' => ['status' => 'ON PROCESS'],
    ]])]);

    $tracking = (new RajaOngkirShipmentTracker)->track('AWB-1', 'jne');

    expect($tracking['status'])->toBe('IN TRANSIT')
        ->and($tracking['history'])->toHaveCount(1);
    Http::assertSent(fn ($request) => str_contains($request->url(), 'awb=AWB-1')
        && str_contains($request->url(), 'courier=jne'));
});
