<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = 'PENDING';
    case SETTLEMENT = 'SETTLEMENT';
    case CAPTURE = 'CAPTURE';
    case DENY = 'DENY';
    case CANCEL = 'CANCEL';
    case EXPIRE = 'EXPIRE';
    case REFUND = 'REFUND';
    case FAILURE = 'FAILURE';
}
