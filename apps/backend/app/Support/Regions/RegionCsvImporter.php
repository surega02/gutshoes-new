<?php

namespace App\Support\Regions;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class RegionCsvImporter
{
    private const BATCH_SIZE = 1000;

    /** @return array<string, int> */
    public function import(bool $fresh = false): array
    {
        DB::disableQueryLog();
        $manifest = $this->validatedManifest();

        return DB::transaction(function () use ($fresh, $manifest): array {
            if ($fresh) {
                foreach (['region_villages', 'region_districts', 'region_regencies', 'region_provinces'] as $table) {
                    DB::table($table)->delete();
                }
            }

            $provinceCodes = [];
            $regencyCodes = [];
            $districtCodes = [];
            $counts = [];

            $counts['provinces.csv'] = $this->load('provinces.csv', ['id', 'code', 'name'], 'region_provinces', '/^\d{2}$/',
                function (array $row) use (&$provinceCodes): array {
                    $provinceCodes[$row['code']] = true;

                    return ['code' => $row['code'], 'name' => $row['name']];
                });
            $counts['regencies.csv'] = $this->load('regencies.csv', ['id', 'province_id', 'code', 'name'], 'region_regencies', '/^\d{2}\.\d{2}$/',
                function (array $row, int $line) use (&$provinceCodes, &$regencyCodes): array {
                    $parent = substr($row['code'], 0, 2);
                    $this->assertParent('provinsi', $parent, $provinceCodes, $line);
                    if ($row['province_id'] !== str_replace('.', '', $parent)) {
                        throw new RuntimeException("regencies.csv baris {$line}: province_id tidak cocok dengan kode.");
                    }
                    $regencyCodes[$row['code']] = true;

                    return ['code' => $row['code'], 'province_code' => $parent, 'name' => $row['name']];
                });
            $counts['districts.csv'] = $this->load('districts.csv', ['id', 'regency_id', 'code', 'name'], 'region_districts', '/^\d{2}\.\d{2}\.\d{2}$/',
                function (array $row, int $line) use (&$regencyCodes, &$districtCodes): array {
                    $parent = substr($row['code'], 0, 5);
                    $this->assertParent('kota/kabupaten', $parent, $regencyCodes, $line);
                    if ($row['regency_id'] !== str_replace('.', '', $parent)) {
                        throw new RuntimeException("districts.csv baris {$line}: regency_id tidak cocok dengan kode.");
                    }
                    $districtCodes[$row['code']] = true;

                    return ['code' => $row['code'], 'regency_code' => $parent, 'name' => $row['name']];
                });
            $counts['villages.csv'] = $this->load('villages.csv', ['id', 'district_id', 'code', 'name', 'postal_code'], 'region_villages', '/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/',
                function (array $row, int $line) use (&$districtCodes): array {
                    $parent = substr($row['code'], 0, 8);
                    $this->assertParent('kecamatan', $parent, $districtCodes, $line);
                    if ($row['district_id'] !== str_replace('.', '', $parent)) {
                        throw new RuntimeException("villages.csv baris {$line}: district_id tidak cocok dengan kode.");
                    }
                    if (! preg_match('/^\d{5}$/', $row['postal_code'])) {
                        throw new RuntimeException("villages.csv baris {$line}: kode pos harus lima digit.");
                    }

                    return ['code' => $row['code'], 'district_code' => $parent, 'name' => $row['name'], 'postal_code' => $row['postal_code']];
                });

            foreach ($counts as $filename => $count) {
                if ($count !== $manifest['files'][$filename]['rows']) {
                    throw new RuntimeException("{$filename}: jumlah baris tidak sesuai manifest.");
                }
            }

            return $counts;
        }, 3);
    }

    /** @return array{files: array<string, array{rows: int, sha256: string}>} */
    private function validatedManifest(): array
    {
        $path = database_path('data/regions/manifest.json');
        $contents = file_get_contents($path);
        $manifest = $contents === false ? null : json_decode($contents, true);
        if (! is_array($manifest) || ! isset($manifest['files']) || ! is_array($manifest['files'])) {
            throw new RuntimeException('Manifest master wilayah tidak valid.');
        }

        foreach (['provinces.csv', 'regencies.csv', 'districts.csv', 'villages.csv'] as $filename) {
            $metadata = $manifest['files'][$filename] ?? null;
            $csvPath = database_path('data/regions/'.$filename);
            if (! is_array($metadata) || ! isset($metadata['rows'], $metadata['sha256']) || ! is_file($csvPath)) {
                throw new RuntimeException("Manifest {$filename} tidak lengkap.");
            }
            if (! hash_equals(strtolower((string) $metadata['sha256']), hash_file('sha256', $csvPath))) {
                throw new RuntimeException("Checksum {$filename} tidak sesuai manifest.");
            }
            $manifest['files'][$filename]['rows'] = (int) $metadata['rows'];
        }

        return $manifest;
    }

    /**
     * @param  list<string>  $expectedHeader
     * @param  callable(array<string, string>, int): array<string, string>  $map
     */
    private function load(string $filename, array $expectedHeader, string $table, string $codePattern, callable $map): int
    {
        $path = database_path('data/regions/'.$filename);
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new RuntimeException("CSV wilayah tidak dapat dibuka: {$path}");
        }

        try {
            $header = fgetcsv($handle);
            if ($header !== $expectedHeader) {
                throw new RuntimeException("{$filename}: header CSV tidak sesuai kontrak.");
            }

            $previousCode = null;
            $batch = [];
            $count = 0;
            $line = 1;
            $timestamp = now();

            while (($values = fgetcsv($handle)) !== false) {
                $line++;
                if (count($values) !== count($header)) {
                    throw new RuntimeException("{$filename} baris {$line}: jumlah kolom tidak sesuai header.");
                }

                /** @var array<string, string> $row */
                $row = array_combine($header, array_map(static fn ($value): string => trim((string) $value), $values));
                if ($row['code'] === '' || $row['name'] === '' || ! preg_match($codePattern, $row['code'])) {
                    throw new RuntimeException("{$filename} baris {$line}: kode atau nama wilayah tidak valid.");
                }
                if ($previousCode !== null && strcmp($row['code'], $previousCode) <= 0) {
                    throw new RuntimeException("{$filename} baris {$line}: kode harus unik dan terurut menaik.");
                }
                $previousCode = $row['code'];

                $batch[] = $map($row, $line) + ['created_at' => $timestamp, 'updated_at' => $timestamp];
                $count++;
                if (count($batch) >= self::BATCH_SIZE) {
                    DB::table($table)->upsert($batch, ['code'], $this->updateColumns($batch[0]));
                    $batch = [];
                }
            }

            if ($count === 0) {
                throw new RuntimeException("{$filename}: CSV tidak boleh kosong.");
            }
            if ($batch !== []) {
                DB::table($table)->upsert($batch, ['code'], $this->updateColumns($batch[0]));
            }

            return $count;
        } finally {
            fclose($handle);
        }
    }

    /** @param array<string, bool> $parents */
    private function assertParent(string $type, string $code, array $parents, int $line): void
    {
        if (! isset($parents[$code])) {
            throw new RuntimeException("CSV baris {$line}: parent {$type} {$code} tidak ditemukan.");
        }
    }

    /**
     * @param  array<string, mixed>  $row
     * @return list<string>
     */
    private function updateColumns(array $row): array
    {
        return array_values(array_diff(array_keys($row), ['code', 'created_at']));
    }
}
