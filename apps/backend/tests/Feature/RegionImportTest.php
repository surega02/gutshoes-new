<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('memvalidasi dan mengimpor seluruh CSV wilayah secara idempoten', function () {
    ini_set('memory_limit', '256M');

    $this->artisan('regions:import')->assertSuccessful();

    expect(DB::table('region_provinces')->count())->toBe(38)
        ->and(DB::table('region_regencies')->count())->toBe(514)
        ->and(DB::table('region_districts')->count())->toBe(7285)
        ->and(DB::table('region_villages')->count())->toBe(83762);

    DB::table('region_provinces')->where('code', '31')->update(['name' => 'Nama Salah']);

    $this->artisan('regions:import')->assertSuccessful();

    expect(DB::table('region_provinces')->count())->toBe(38)
        ->and(DB::table('region_regencies')->count())->toBe(514)
        ->and(DB::table('region_districts')->count())->toBe(7285)
        ->and(DB::table('region_villages')->count())->toBe(83762)
        ->and(DB::table('region_provinces')->where('code', '31')->value('name'))->toBe('Daerah Khusus Ibukota Jakarta');
});
