<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rainfall_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')
                ->constrained('areas')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('data_source_id')
                ->nullable()
                ->constrained('data_sources')
                ->nullOnDelete()
                ->cascadeOnUpdate();
            $table->timestamp('observed_at');
            $table->unsignedSmallInteger('period_hours')->nullable();
            $table->decimal('rainfall_mm', 10, 2)->nullable();
            $table->string('quality_status', 30);
            $table->json('raw_metadata')->nullable();
            $table->timestamps();

            $table->index(['area_id', 'observed_at']);
            $table->index(['data_source_id', 'observed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rainfall_records');
    }
};
