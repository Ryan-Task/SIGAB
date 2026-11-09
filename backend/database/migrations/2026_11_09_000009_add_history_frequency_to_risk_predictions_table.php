<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('risk_predictions', function (Blueprint $table) {
            $table->unsignedSmallInteger('history_count')->nullable()->after('history_score');
            $table->string('history_frequency', 30)->nullable()->after('history_count');
        });
    }

    public function down(): void
    {
        Schema::table('risk_predictions', function (Blueprint $table) {
            $table->dropColumn(['history_count', 'history_frequency']);
        });
    }
};
