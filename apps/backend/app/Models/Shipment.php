<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $guarded = [];

    protected $table = 'shipments';

    protected function casts(): array
    {
        return ['quote_snapshot' => 'array', 'fee' => 'decimal:2', 'shipped_at' => 'datetime', 'delivered_at' => 'datetime'];
    }
}
