<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('conversation_views')) {
            return;
        }

        DB::table('conversation_views')
            ->where('internal', true)
            ->where('key', 'mine')
            ->where('name', 'Your inbox')
            ->update(['name' => 'Your chats']);
    }
};
