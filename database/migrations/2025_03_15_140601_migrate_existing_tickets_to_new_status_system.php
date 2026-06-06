<?php

use App\Conversations\Models\Conversation;
use Database\Seeders\ConversationStatusesSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('conversations', 'status')) {
            return;
        }

        app(ConversationStatusesSeeder::class)->run();

        $statuses = DB::table('conversation_statuses')->get();
        $open = $statuses
            ->where('category', Conversation::STATUS_OPEN)
            ->first();
        $pending = $statuses
            ->where('category', Conversation::STATUS_PENDING)
            ->first();
        $closed = $statuses
            ->where('category', Conversation::STATUS_CLOSED)
            ->first();
        $locked = $statuses
            ->where('category', Conversation::STATUS_LOCKED)
            ->first();

        DB::table('conversations')
            ->where('status', 'open')
            ->update([
                'status_category' => $open->category,
                'status_id' => $open->id,
            ]);

        DB::table('conversations')
            ->where('status', 'pending')
            ->update([
                'status_category' => $pending->category,
                'status_id' => $pending->id,
            ]);

        DB::table('conversations')
            ->where('status', 'closed')
            ->orWhere('status', 'spam')
            ->update([
                'status_category' => $closed->category,
                'status_id' => $closed->id,
            ]);

        DB::table('conversations')
            ->where('status', 'locked')
            ->update([
                'status_category' => $locked->category,
                'status_id' => $locked->id,
            ]);

        Schema::dropColumns('conversations', ['status']);
    }
};
