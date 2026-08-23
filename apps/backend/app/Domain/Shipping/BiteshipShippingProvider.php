<?php

namespace App\Domain\Shipping;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class BiteshipShippingProvider implements ShippingProvider
{
    /**
     * @param  array<string, mixed>  $origin
     * @param  array<string, mixed>  $destination
     * @return list<ShippingQuote>
     */
    public function quote(array $origin, array $destination, int $weightGrams, int $quantity, ?string $courier = null): array
    {
        $response = Http::baseUrl((string) config('services.biteship.url'))->withToken((string) config('services.biteship.api_key'))->timeout(10)->retry(2, 200)->post('/v1/rates/couriers', ['origin_area_id' => $origin['provider_area_id'], 'destination_area_id' => $destination['provider_area_id'], 'couriers' => $courier ?: 'jne,sicepat,jnt', 'items' => [['name' => 'Shoes', 'value' => 0, 'weight' => $weightGrams, 'quantity' => $quantity]]]);
        if ($response->failed()) {
            throw new RuntimeException('Shipping provider unavailable.');
        }
        $pricing = $response->json('pricing');
        $quotes = [];
        if (! is_array($pricing)) {
            return $quotes;
        }
        foreach ($pricing as $rate) {
            if (! is_array($rate)) {
                continue;
            } $quotes[] = new ShippingQuote('BITESHIP', (string) ($rate['company'] ?? ''), (string) ($rate['courier_service_code'] ?? ''), (string) ($rate['courier_service_name'] ?? ''), number_format((float) ($rate['price'] ?? 0), 2, '.', ''), (int) ($rate['duration'] ?? 0));
        }

        return $quotes;
    }
}
