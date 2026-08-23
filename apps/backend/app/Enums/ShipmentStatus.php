<?php

namespace App\Enums;

enum ShipmentStatus: string
{
    case PENDING = 'PENDING';
    case READY = 'READY';
    case SHIPPED = 'SHIPPED';
    case DELIVERED = 'DELIVERED';
    case FAILED = 'FAILED';
}
