<?php

namespace App\Jobs;

use App\Domain\Inventory\InventoryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

// Compatibility for jobs already queued by an older release. Order closure owns release.
class ReleaseExpiredInventoryReservations implements ShouldQueue
{
    use Queueable;

    public function handle(InventoryService $inventory): void
    {
        (new ExpirePendingOrders)->handle($inventory);
    }
}
