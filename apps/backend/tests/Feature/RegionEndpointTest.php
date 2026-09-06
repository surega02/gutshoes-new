<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    DB::table('region_provinces')->insert([
        ['code' => '31', 'name' => 'Daerah Khusus Ibukota Jakarta'],
        ['code' => '32', 'name' => 'Jawa Barat'],
    ]);
    DB::table('region_regencies')->insert([
        ['code' => '31.71', 'province_code' => '31', 'name' => 'Kota Jakarta Selatan'],
        ['code' => '32.73', 'province_code' => '32', 'name' => 'Kota Bandung'],
    ]);
    DB::table('region_districts')->insert([
        ['code' => '31.71.01', 'regency_code' => '31.71', 'name' => 'Tebet'],
        ['code' => '32.73.05', 'regency_code' => '32.73', 'name' => 'Coblong'],
    ]);
    DB::table('region_villages')->insert([
        ['code' => '31.71.01.1001', 'district_code' => '31.71.01', 'name' => 'Tebet Barat', 'postal_code' => '12810'],
        ['code' => '32.73.05.1001', 'district_code' => '32.73.05', 'name' => 'Dago', 'postal_code' => '40135'],
    ]);
});

it('menyajikan provinsi berurutan dengan kontrak data minimal', function () {
    $this->getJson('/api/v1/regions/provinces')
        ->assertOk()
        ->assertExactJson(['data' => [
            ['code' => '31', 'name' => 'Daerah Khusus Ibukota Jakarta'],
            ['code' => '32', 'name' => 'Jawa Barat'],
        ]]);
});

it('memfilter setiap tingkat wilayah berdasarkan parent dan menyertakan kode pos desa', function () {
    $this->getJson('/api/v1/regions/regencies?province_code=32')
        ->assertOk()
        ->assertExactJson(['data' => [['code' => '32.73', 'name' => 'Kota Bandung']]]);

    $this->getJson('/api/v1/regions/districts?regency_code=31.71')
        ->assertOk()
        ->assertExactJson(['data' => [['code' => '31.71.01', 'name' => 'Tebet']]]);

    $this->getJson('/api/v1/regions/villages?district_code=31.71.01')
        ->assertOk()
        ->assertExactJson(['data' => [['code' => '31.71.01.1001', 'name' => 'Tebet Barat', 'postal_code' => '12810']]]);
});

it('menolak parent wilayah yang hilang atau tidak dikenal', function () {
    $this->getJson('/api/v1/regions/regencies')->assertUnprocessable()->assertJsonValidationErrors('province_code');
    $this->getJson('/api/v1/regions/districts?regency_code=99.99')->assertUnprocessable()->assertJsonValidationErrors('regency_code');
    $this->getJson('/api/v1/regions/villages?district_code=99.99.99')->assertUnprocessable()->assertJsonValidationErrors('district_code');
});
