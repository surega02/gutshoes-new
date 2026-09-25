<?php

namespace App\Domain\Shipping;

use DomainException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class RajaOngkirShippingAreaMapper implements ShippingAreaMapper
{
    public function map(array $address, string $fallback): string
    {
        $query = implode(', ', array_filter([$address['village'] ?? null, $address['district'] ?? null, $address['city'] ?? null, $address['postal_code'] ?? null]));

        return Cache::remember('rajaongkir-area:'.sha1($query), now()->addDays(30), function () use ($query, $address): string {
            $response = Http::baseUrl((string) config('services.rajaongkir.url'))
                ->withHeaders(['key' => (string) config('services.rajaongkir.api_key')])
                ->timeout(10)->retry(2, 200)
                ->get('/destination/domestic-destination', ['search' => $query, 'limit' => 20, 'offset' => 0]);

            if ($response->failed() || ! is_array($response->json('data'))) {
                throw new DomainException('Area pengiriman tidak dapat dipetakan. Coba lagi atau hubungi admin.');
            }

            $matches = collect($response->json('data'))->filter(fn ($candidate): bool => is_array($candidate)
                && (string) ($candidate['zip_code'] ?? '') === (string) ($address['postal_code'] ?? '')
                && strcasecmp((string) ($candidate['district_name'] ?? ''), (string) ($address['district'] ?? '')) === 0);
            if ($matches->count() !== 1 || ! filled($matches->first()['id'] ?? null)) {
                throw new DomainException('Area pengiriman RajaOngkir tidak ditemukan secara unik. Periksa kecamatan dan kode pos.');
            }

            return (string) $matches->first()['id'];
        });
    }
}
