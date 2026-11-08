<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('areas', function (Blueprint $table): void {
            $table->string('regency_code', 10)->nullable()->index()->after('code');
            $table->string('regency_name')->nullable()->index()->after('regency_code');
            $table->string('province_code', 10)->nullable()->index()->after('regency_name');
            $table->string('province_name')->nullable()->after('province_code');
        });
    }

    public function down(): void
    {
        Schema::table('areas', function (Blueprint $table): void {
            $table->dropColumn(['regency_code', 'regency_name', 'province_code', 'province_name']);
        });
    }
};
