<?php

namespace App\Domain\Shipping;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RajaOngkirShipmentTracker implements ShipmentTracker
{
    public function track(string $trackingNumber, string $courier): array
    {
        $response = Http::baseUrl((string) config('services.rajaongkir.url'))
            ->withHeaders(['key' => (string) config('services.rajaongkir.api_key')])
            ->timeout(10)->retry(2, 200)
            ->post('/track/waybill?'.http_build_query(['awb' => $trackingNumber, 'courier' => $courier]));

        if ($response->failed() || ! is_array($response->json('data'))) {
            throw new RuntimeException('Shipment tracking provider unavailable.');
        }

        $data = $response->json('data');

        return [
            'delivered' => (bool) ($data['delivered'] ?? false),
            'status' => (string) ($data['summary']['status'] ?? ''),
            'summary' => $data['summary'] ?? [],
            'history' => $data['manifest'] ?? [],
            'delivery' => $data['delivery_status'] ?? null,
        ];
    }
}
