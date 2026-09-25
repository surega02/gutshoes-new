<?php

namespace App\Domain\Shipping;

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
        return $this->provider->quote($origin, $destination, $weightGrams, $quantity, $courier);
    }
}
