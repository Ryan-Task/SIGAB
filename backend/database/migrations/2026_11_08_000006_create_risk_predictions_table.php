<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')
                ->constrained('areas')
                ->restrictOnDelete()
                ->cascadeOnUpdate();
            $table->unsignedTinyInteger('score')->nullable();
            $table->string('risk_level', 30);
            $table->decimal('rainfall_score', 5, 2)->nullable();
            $table->decimal('history_score', 5, 2)->nullable();
            $table->decimal('environment_score', 5, 2)->nullable();
            $table->json('input_snapshot')->nullable();
            $table->string('method_version', 50);
            $table->timestamp('data_as_of')->nullable();
            $table->timestamp('calculated_at');
            $table->string('status', 30)->default('valid');
            $table->json('explanation')->nullable();
            $table->timestamps();

            $table->index(['area_id', 'calculated_at']);
            $table->index(['risk_level', 'calculated_at']);
            $table->index(['status', 'calculated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_predictions');
    }
};
