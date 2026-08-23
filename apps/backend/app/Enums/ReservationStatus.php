<?php

namespace App\Enums;

enum ReservationStatus: string
{
    case ACTIVE = 'ACTIVE';
    case RELEASED = 'RELEASED';
    case SOLD = 'SOLD';
    case EXPIRED = 'EXPIRED';
}
