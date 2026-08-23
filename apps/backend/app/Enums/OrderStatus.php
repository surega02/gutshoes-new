<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING_PAYMENT = 'PENDING_PAYMENT';
    case PAID = 'PAID';
    case PROCESSING = 'PROCESSING';
    case SHIPPED = 'SHIPPED';
    case DELIVERED = 'DELIVERED';
    case CANCELLED = 'CANCELLED';
    case EXPIRED = 'EXPIRED';
}
