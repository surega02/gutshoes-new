<?php

namespace App\Domain\Shipping;

class FakeShippingAreaMapper implements ShippingAreaMapper
{
    public function map(array $address, string $fallback): string
    {
        return $fallback;
    }
}
