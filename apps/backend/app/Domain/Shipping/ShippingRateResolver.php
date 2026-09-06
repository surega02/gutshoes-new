<?php

namespace App\Domain\Shipping;

use DomainException;

class ShippingRateResolver
{
    public function __construct(private readonly ShippingProvider $provider) {}

    /**
     * @param  array<string,mixed>  $origin
     * @param  array<string,mixed>  $destination
     * @return list<ShippingQuote>
     */
    public function quotes(array $origin, array $destination, int $weightGrams, int $quantity, ?string $courier = null): array
    {
        if ($this->isJabodetabek((string) ($destination['province'] ?? ''), (string) ($destination['city'] ?? ''))) {
            return $this->provider->quote($origin, $destination, $weightGrams, $quantity, $courier);
        }
        $rate = $this->regionalRate((string) ($destination['province'] ?? ''));

        return [new ShippingQuote('GUTSHOES_REGIONAL', 'gutshoes', 'REGIONAL_PER_ITEM', 'Tarif regional Rp'.number_format($rate, 0, ',', '.').' per item', number_format($rate * $quantity, 2, '.', ''), 0)];
    }

    private function isJabodetabek(string $province, string $city): bool
    {
        $province = $this->normalize($province);
        $city = $this->normalize($city);
        if ($province === 'dki jakarta') {
            return true;
        }
        foreach (['jakarta', 'bogor', 'depok', 'tangerang', 'bekasi'] as $name) {
            if (str_contains($city, $name)) {
                return true;
            }
        }

        return false;
    }

    private function regionalRate(string $province): int
    {
        $province = $this->normalize($province);
        $rates = [20000 => ['jawa barat', 'jawa tengah', 'jawa timur'], 30000 => ['aceh', 'sumatera utara', 'sumatera barat', 'riau', 'kepulauan riau', 'jambi', 'sumatera selatan', 'kepulauan bangka belitung', 'bengkulu', 'lampung'], 40000 => ['kalimantan barat', 'kalimantan tengah', 'kalimantan selatan', 'kalimantan timur', 'kalimantan utara', 'sulawesi utara', 'gorontalo', 'sulawesi tengah', 'sulawesi barat', 'sulawesi selatan', 'sulawesi tenggara']];
        foreach ($rates as $rate => $provinces) {
            if (in_array($province, $provinces, true)) {
                return $rate;
            }
        }
        throw new DomainException('Tarif pengiriman untuk provinsi tujuan belum tersedia.');
    }

    private function normalize(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $value) ?? $value));
    }
}
