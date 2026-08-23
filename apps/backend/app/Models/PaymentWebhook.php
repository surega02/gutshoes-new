<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentWebhook extends Model
{
    protected $guarded = [];

    protected $table = 'payment_webhooks';

    protected function casts(): array
    {
        return ['payload_redacted' => 'array', 'processed_at' => 'datetime'];
    }
}
