<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('risk_predictions', function (Blueprint $table): void {
            $table->decimal('drainage_score', 5, 2)->nullable()->after('environment_score');
        });
    }

    public function down(): void
    {
        Schema::table('risk_predictions', function (Blueprint $table): void {
            $table->dropColumn('drainage_score');
        });
    }
};
