<?php

namespace App\Domain\Shipping;

interface ShippingProvider
{
    /**
     * @param  array<string, mixed>  $origin
     * @param  array<string, mixed>  $destination
     * @return list<ShippingQuote>
     */
    public function quote(array $origin, array $destination, int $weightGrams, int $quantity, ?string $courier = null): array;
}
