<?php

namespace App\Jobs;

use App\Domain\Inventory\InventoryService;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ReleaseExpiredInventoryReservations implements ShouldQueue
{
    use Queueable;

    public function handle(InventoryService $inventory): void
    {
        InventoryReservation::query()->where('status', ReservationStatus::ACTIVE->value)->where('expires_at', '<=', now())
            ->chunkById(100, fn ($reservations) => $reservations->each(fn (InventoryReservation $reservation) => $inventory->release($reservation, ReservationStatus::EXPIRED)));
    }
}
