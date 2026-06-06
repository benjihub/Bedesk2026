<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $agentIds = DB::table('users')->where('type', 'agent')->pluck('id');

        DB::table('conversation_items')
            ->whereNull('author')
            ->whereIn('user_id', $agentIds)
            ->update(['author' => 'agent']);

        DB::table('conversation_items')
            ->whereNull('author')
            ->update(['author' => 'user']);
    }
};
