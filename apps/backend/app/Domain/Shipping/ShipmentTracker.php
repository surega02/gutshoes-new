<?php

namespace App\Domain\Shipping;

interface ShipmentTracker
{
    /** @return array<string, mixed> */
    public function track(string $trackingNumber, string $courier): array;
}
