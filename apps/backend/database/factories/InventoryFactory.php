<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryFactory extends Factory
{
    public function definition(): array
    {
        return ['warehouse_id' => Warehouse::factory(), 'product_variant_id' => ProductVariant::factory(), 'on_hand' => 10, 'reserved' => 0, 'sold' => 0];
    }
}
