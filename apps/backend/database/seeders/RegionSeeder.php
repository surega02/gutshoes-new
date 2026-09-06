<?php

namespace Database\Seeders;

use App\Support\Regions\RegionCsvImporter;
use Illuminate\Database\Seeder;

class RegionSeeder extends Seeder
{
    public function run(RegionCsvImporter $importer): void
    {
        $counts = $importer->import();
        $this->command?->info('Master wilayah tersinkron: '.number_format(array_sum($counts), 0, ',', '.').' baris sumber.');
    }
}
