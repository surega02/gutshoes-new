<?php

namespace App\Enums;

enum CancellationStatus: string
{
    case REQUESTED = 'REQUESTED';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
}
