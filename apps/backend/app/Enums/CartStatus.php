<?php

namespace App\Enums;

enum CartStatus: string
{
    case ACTIVE = 'ACTIVE';
    case CONVERTED = 'CONVERTED';
    case ABANDONED = 'ABANDONED';
}
