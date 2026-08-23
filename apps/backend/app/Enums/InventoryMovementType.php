<?php

namespace App\Enums;

enum InventoryMovementType: string
{
    case ADD = 'ADD';
    case ADJUST = 'ADJUST';
    case RESERVE = 'RESERVE';
    case RELEASE = 'RELEASE';
    case SELL = 'SELL';
    case RETURN = 'RETURN';
}
