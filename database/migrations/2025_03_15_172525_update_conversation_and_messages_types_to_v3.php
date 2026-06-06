<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('conversation_items')
            ->where('author', 'visitor')
            ->update(['author' => 'user']);

        DB::table('conversation_items')
            ->where('type', 'replies')
            ->update(['type' => 'message']);

        DB::table('conversation_items')
            ->where('type', 'notes')
            ->update(['type' => 'note']);

        DB::table('file_entry_models')
            ->where('model_type', 'ticket')
            ->update(['model_type' => 'conversation']);

        DB::table('file_entry_models')
            ->where('model_type', 'reply')
            ->update(['model_type' => 'conversationItem']);

        DB::table('taggables')
            ->where('taggable_type', 'ticket')
            ->update(['taggable_type' => 'conversation']);
    }
};
