<?php

namespace App\Console\Commands;

use App\Support\Regions\RegionCsvImporter;
use Illuminate\Console\Command;
use Throwable;

class ImportRegions extends Command
{
    protected $signature = 'regions:import
        {--fresh : Hapus seluruh master wilayah sebelum impor}
        {--force : Izinkan operasi fresh di production}';

    protected $description = 'Validasi dan impor master wilayah dari CSV lokal secara idempoten';

    public function handle(RegionCsvImporter $importer): int
    {
        if ($this->option('fresh') && app()->isProduction() && ! $this->option('force')) {
            $this->error('Opsi --fresh di production membutuhkan --force. Gunakan impor normal untuk deployment rutin.');

            return self::FAILURE;
        }

        try {
            $counts = $importer->import((bool) $this->option('fresh'));
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        foreach ($counts as $label => $count) {
            $this->line(sprintf('%s: %s baris sumber tervalidasi', $label, number_format($count, 0, ',', '.')));
        }

        $this->info('Master wilayah berhasil divalidasi dan disinkronkan.');

        return self::SUCCESS;
    }
}
