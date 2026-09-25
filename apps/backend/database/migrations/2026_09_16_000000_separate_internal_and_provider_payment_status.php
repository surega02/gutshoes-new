<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('payments', 'provider_status')) {
            Schema::table('payments', function (Blueprint $table): void {
                $table->string('provider_status', 32)->nullable()->index()->after('status');
            });
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY status ENUM('PENDING','SUCCESS','FAILED','SETTLEMENT','CAPTURE','DENY','CANCEL','EXPIRE','REFUND','FAILURE') NOT NULL DEFAULT 'PENDING'");
        }

        DB::table('payments')->whereNull('provider_status')->update(['provider_status' => DB::raw('status')]);
        DB::table('payments')->whereIn('status', ['SETTLEMENT', 'CAPTURE', 'REFUND'])->update(['status' => 'SUCCESS']);
        DB::table('payments')->whereIn('status', ['DENY', 'CANCEL', 'EXPIRE', 'FAILURE'])->update(['status' => 'FAILED']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY status ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY status ENUM('PENDING','SUCCESS','FAILED','SETTLEMENT','CAPTURE','DENY','CANCEL','EXPIRE','REFUND','FAILURE') NOT NULL DEFAULT 'PENDING'");
            DB::table('payments')->where('status', 'SUCCESS')->update(['status' => 'SETTLEMENT']);
            DB::table('payments')->where('status', 'FAILED')->update(['status' => 'FAILURE']);
            DB::statement("ALTER TABLE payments MODIFY status ENUM('PENDING','SETTLEMENT','CAPTURE','DENY','CANCEL','EXPIRE','REFUND','FAILURE') NOT NULL DEFAULT 'PENDING'");
        }

        Schema::table('payments', fn (Blueprint $table) => $table->dropColumn('provider_status'));
    }
};
