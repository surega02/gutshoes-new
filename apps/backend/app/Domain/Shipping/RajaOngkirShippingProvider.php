<?php

namespace App\Domain\Shipping;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RajaOngkirShippingProvider implements ShippingProvider
{
    public function quote(array $origin, array $destination, int $weightGrams, int $quantity, ?string $courier = null): array
    {
        $response = Http::baseUrl((string) config('services.rajaongkir.url'))
            ->withHeaders(['key' => (string) config('services.rajaongkir.api_key')])
            ->asForm()->timeout(10)->retry(2, 200)
            ->post('/calculate/domestic-cost', [
                'origin' => $origin['provider_area_id'],
                'destination' => $destination['provider_area_id'],
                'weight' => max(1, $weightGrams),
                'courier' => $courier ?: config('services.rajaongkir.couriers'),
            ]);

        if ($response->failed() || ! is_array($response->json('data'))) {
            throw new RuntimeException('Shipping provider unavailable.');
        }

        return collect($response->json('data'))->filter(fn ($rate): bool => is_array($rate))->map(fn (array $rate): ShippingQuote => new ShippingQuote(
            'RAJAONGKIR',
            (string) ($rate['code'] ?? ''),
            (string) ($rate['service'] ?? ''),
            (string) ($rate['description'] ?? $rate['name'] ?? ''),
            number_format((float) ($rate['cost'] ?? 0), 2, '.', ''),
            $this->estimatedDays((string) ($rate['etd'] ?? '')),
        ))->values()->all();
    }

    private function estimatedDays(string $etd): int
    {
        preg_match_all('/\d+/', $etd, $matches);

        $days = $matches[0];

        return $days === [] ? 0 : (int) max($days);
    }
}
