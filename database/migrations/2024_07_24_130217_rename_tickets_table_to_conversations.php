<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('tickets') || Schema::hasTable('conversations')) {
            return;
        }

        Schema::rename('tickets', 'conversations');

        Schema::table('conversations', function (Blueprint $table) {
            $table
                ->string('subject')
                ->index()
                ->nullable()
                ->change();
            $table
                ->integer('user_id')
                ->index()
                ->nullable()
                ->change();
            $table
                ->integer('group_id')
                ->unsigned()
                ->index()
                ->nullable();
        });
    }

    public function down(): void
    {
        //
    }
};
