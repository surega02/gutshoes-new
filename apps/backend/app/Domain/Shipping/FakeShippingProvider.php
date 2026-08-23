<?php

namespace App\Domain\Shipping;

class FakeShippingProvider implements ShippingProvider
{
    /**
     * @param  array<string, mixed>  $origin
     * @param  array<string, mixed>  $destination
     * @return list<ShippingQuote>
     */
    public function quote(array $origin, array $destination, int $weightGrams, int $quantity, ?string $courier = null): array
    {
        return [new ShippingQuote('FAKE', $courier ?: 'jne', 'REG', 'Regular', '20000.00', 3), new ShippingQuote('FAKE', $courier ?: 'jne', 'YES', 'Next Day', '40000.00', 1)];
    }
}
