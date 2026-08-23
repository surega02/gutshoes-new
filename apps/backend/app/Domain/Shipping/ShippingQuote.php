<?php

namespace App\Domain\Shipping;

final readonly class ShippingQuote
{
    public function __construct(public string $provider, public string $courier, public string $service, public string $description, public string $fee, public int $estimatedDays) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return ['provider' => $this->provider, 'courier' => $this->courier, 'service' => $this->service, 'description' => $this->description, 'fee' => $this->fee, 'estimated_days' => $this->estimatedDays];
    }
}
