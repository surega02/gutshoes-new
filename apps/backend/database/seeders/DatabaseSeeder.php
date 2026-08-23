<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->warn('Development seeder dilewati di production.');

            return;
        }

        $warehouse = Warehouse::factory()->create(['code' => 'JKT-DEV-01', 'name' => 'Gudang Development Jakarta']);
        ProductVariant::factory()->count(12)->create()->each(
            fn (ProductVariant $variant) => Inventory::factory()->create([
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $variant->id,
            ])
        );
    }
}
