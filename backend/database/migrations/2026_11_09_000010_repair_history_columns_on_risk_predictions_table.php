<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [];

        if (! Schema::hasColumn('risk_predictions', 'history_count')) {
            $columns['history_count'] = fn (Blueprint $table) => $table
                ->unsignedSmallInteger('history_count')
                ->nullable()
                ->after('history_score');
        }

        if (! Schema::hasColumn('risk_predictions', 'history_frequency')) {
            $columns['history_frequency'] = fn (Blueprint $table) => $table
                ->string('history_frequency', 30)
                ->nullable()
                ->after('history_count');
        }

        if ($columns !== []) {
            Schema::table('risk_predictions', function (Blueprint $table) use ($columns): void {
                foreach ($columns as $column) {
                    $column($table);
                }
            });
        }
    }

    public function down(): void
    {
        $columns = [];

        if (Schema::hasColumn('risk_predictions', 'history_frequency')) {
            $columns[] = 'history_frequency';
        }

        if (Schema::hasColumn('risk_predictions', 'history_count')) {
            $columns[] = 'history_count';
        }

        if ($columns !== []) {
            Schema::table('risk_predictions', function (Blueprint $table) use ($columns): void {
                $table->dropColumn($columns);
            });
        }
    }
};
