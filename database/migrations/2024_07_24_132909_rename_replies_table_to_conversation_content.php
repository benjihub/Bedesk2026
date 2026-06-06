<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (
            !Schema::hasTable('replies') ||
            Schema::hasTable('conversation_items')
        ) {
            return;
        }

        Schema::rename('replies', 'conversation_items');

        Schema::table('conversation_items', function (Blueprint $table) {
            $table->integer('user_id')->index()->nullable()->change();
            $table->renameColumn('ticket_id', 'conversation_id');
            $table->string('author', 40)->nullable()->index()->after('user_id');
            $table->uuid('uuid')->change();
            $table->string('type', 40)->default('message')->change();
        });
    }
};
