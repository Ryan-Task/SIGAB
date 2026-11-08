<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider');
            $table->string('source_type', 30);
            $table->string('url')->nullable();
            $table->text('license_note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['source_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sources');
    }
};
