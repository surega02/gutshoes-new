<?php

namespace App\Domain\Shipping;

class NullShipmentTracker implements ShipmentTracker
{
    public function track(string $trackingNumber, string $courier): array
    {
        return ['delivered' => false, 'status' => '', 'summary' => [], 'history' => [], 'delivery' => null];
    }
}
