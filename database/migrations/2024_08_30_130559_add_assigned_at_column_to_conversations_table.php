<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('conversations', 'assigned_at')) {
                $table
                    ->timestamp('assigned_at')
                    ->nullable()
                    ->before('created_at');
            }
        });
    }
};
