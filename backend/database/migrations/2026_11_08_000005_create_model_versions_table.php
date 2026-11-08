<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('model_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version', 50)->unique();
            $table->string('method_name');
            $table->json('weights');
            $table->json('thresholds');
            $table->text('notes')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index(['is_active', 'activated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('model_versions');
    }
};
