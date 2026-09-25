<?php

namespace App\Domain\Shipping;

use DomainException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class BiteshipShippingAreaMapper implements ShippingAreaMapper
{
    public function map(array $address, string $fallback): string
    {
        $query = implode(', ', array_filter([$address['district'] ?? null, $address['city'] ?? null, $address['province'] ?? null, $address['postal_code'] ?? null]));

        return Cache::remember('biteship-area:'.sha1($query), now()->addDays(30), function () use ($query, $address): string {
            $response = Http::baseUrl((string) config('services.biteship.url'))
                ->withHeaders(['Authorization' => (string) config('services.biteship.api_key')])
                ->timeout(10)->retry(2, 200)
                ->get('/v1/maps/areas', ['countries' => 'ID', 'input' => $query, 'type' => 'single']);
            if ($response->failed() || ! is_array($response->json('areas'))) {
                throw new DomainException('Area pengiriman tidak dapat dipetakan. Coba lagi atau hubungi admin.');
            }
            $matches = collect($response->json('areas'))->filter(fn ($candidate): bool => is_array($candidate)
                && (string) ($candidate['postal_code'] ?? '') === (string) ($address['postal_code'] ?? '')
                && strcasecmp((string) ($candidate['administrative_division_level_3_name'] ?? ''), (string) ($address['district'] ?? '')) === 0);
            if ($matches->count() !== 1 || ! filled($matches->first()['id'] ?? null)) {
                throw new DomainException('Area pengiriman Biteship tidak ditemukan secara unik. Periksa kecamatan dan kode pos.');
            }

            return (string) $matches->first()['id'];
        });
    }
}
