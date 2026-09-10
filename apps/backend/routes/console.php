<?php

use App\Jobs\ExpirePendingOrders;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ExpirePendingOrders)->everyMinute()->withoutOverlapping();
