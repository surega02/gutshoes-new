<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->text('guest_access_token')->nullable()->after('payload_hash');
            $table->char('guest_access_token_hash', 64)->nullable()->unique()->after('guest_access_token');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['guest_access_token_hash']);
            $table->dropColumn(['guest_access_token', 'guest_access_token_hash']);
        });
    }
};
