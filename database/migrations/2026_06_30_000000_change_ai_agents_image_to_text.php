<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_agents') || !Schema::hasColumn('ai_agents', 'image')) {
            return;
        }

        Schema::table('ai_agents', function (Blueprint $table) {
            $table->text('image')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('ai_agents') || !Schema::hasColumn('ai_agents', 'image')) {
            return;
        }

        Schema::table('ai_agents', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });
    }
};
