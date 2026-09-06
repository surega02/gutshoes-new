<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, fn (Blueprint $t) => $t->string('village')->nullable()->after('district'));
        }
    }

    public function down(): void
    {
        foreach (['addresses', 'order_addresses'] as $name) {
            Schema::table($name, fn (Blueprint $t) => $t->dropColumn('village'));
        }
    }
};
