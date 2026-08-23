<?php

use App\Jobs\ExpirePendingOrders;
use App\Jobs\ReleaseExpiredInventoryReservations;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ReleaseExpiredInventoryReservations)->everyMinute()->withoutOverlapping();

Schedule::job(new ExpirePendingOrders)->everyMinute()->withoutOverlapping();
