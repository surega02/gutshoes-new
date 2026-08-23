<?php

namespace App\Models;

use Database\Factories\SizeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Size extends Model
{
    /** @use HasFactory<SizeFactory> */
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected $table = 'sizes';
}
