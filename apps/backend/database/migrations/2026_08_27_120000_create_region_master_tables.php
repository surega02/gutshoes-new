<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('region_provinces', fn (Blueprint $table) => $this->region($table));
        Schema::create('region_regencies', function (Blueprint $table): void {
            $this->region($table);
            $table->string('province_code', 2)->index();
        });
        Schema::create('region_districts', function (Blueprint $table): void {
            $this->region($table);
            $table->string('regency_code', 5)->index();
        });
        Schema::create('region_villages', function (Blueprint $table): void {
            $this->region($table);
            $table->string('district_code', 8)->index();
            $table->string('postal_code', 10)->nullable()->index();
        });

        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->string('province_code', 2)->nullable()->index();
                $table->string('regency_code', 5)->nullable()->index();
                $table->string('district_code', 8)->nullable()->index();
                $table->string('village_code', 13)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->dropColumn(['province_code', 'regency_code', 'district_code', 'village_code']);
            });
        }

        Schema::dropIfExists('region_villages');
        Schema::dropIfExists('region_districts');
        Schema::dropIfExists('region_regencies');
        Schema::dropIfExists('region_provinces');
    }

    private function region(Blueprint $table): void
    {
        $table->string('code', 13)->primary();
        $table->string('name');
        $table->timestamps();
    }
};
