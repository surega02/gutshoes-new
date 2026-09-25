<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RegionSeeder::class);

        if (app()->isProduction()) {
            $this->command?->warn('Fixture development dilewati di production.');

            return;
        }

        $this->call(CatalogDemoSeeder::class);
    }
}
