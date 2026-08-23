<?php

use App\Jobs\ReleaseExpiredInventoryReservations;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ReleaseExpiredInventoryReservations)->everyMinute()->withoutOverlapping();
