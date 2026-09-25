<?php

namespace App\Domain\Shipping;

interface ShippingAreaMapper
{
    /** @param array<string, mixed> $address */
    public function map(array $address, string $fallback): string;
}
