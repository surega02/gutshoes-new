<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('region_regencies', function (Blueprint $table): void {
            $table->foreign('province_code')->references('code')->on('region_provinces')->cascadeOnUpdate()->restrictOnDelete();
        });
        Schema::table('region_districts', function (Blueprint $table): void {
            $table->foreign('regency_code')->references('code')->on('region_regencies')->cascadeOnUpdate()->restrictOnDelete();
        });
        Schema::table('region_villages', function (Blueprint $table): void {
            $table->foreign('district_code')->references('code')->on('region_districts')->cascadeOnUpdate()->restrictOnDelete();
        });

        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->foreign('province_code')->references('code')->on('region_provinces')->cascadeOnUpdate()->restrictOnDelete();
                $table->foreign('regency_code')->references('code')->on('region_regencies')->cascadeOnUpdate()->restrictOnDelete();
                $table->foreign('district_code')->references('code')->on('region_districts')->cascadeOnUpdate()->restrictOnDelete();
                $table->foreign('village_code')->references('code')->on('region_villages')->cascadeOnUpdate()->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->dropForeign(['province_code']);
                $table->dropForeign(['regency_code']);
                $table->dropForeign(['district_code']);
                $table->dropForeign(['village_code']);
            });
        }

        Schema::table('region_villages', fn (Blueprint $table) => $table->dropForeign(['district_code']));
        Schema::table('region_districts', fn (Blueprint $table) => $table->dropForeign(['regency_code']));
        Schema::table('region_regencies', fn (Blueprint $table) => $table->dropForeign(['province_code']));
    }
};
