<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flood_events', function (Blueprint $table) {
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
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->string('severity', 30)->nullable();
            $table->text('description')->nullable();
            $table->string('source_reference')->nullable();
            $table->string('verification_status', 30);
            $table->timestamps();

            $table->index(['area_id', 'started_at']);
            $table->index(['verification_status', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flood_events');
    }
};
