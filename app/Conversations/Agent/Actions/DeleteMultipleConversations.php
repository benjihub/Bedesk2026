<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DeleteMultipleConversations
{
    public function execute(iterable $conversationIds): void
    {
        $messageIds = ConversationItem::query()
            ->whereIn('conversation_id', $conversationIds)
            ->pluck('id');

        // detach attachments
        DB::table('file_entry_models')
            ->whereIn('model_id', $messageIds)
            ->where('model_type', ConversationItem::MODEL_TYPE)
            ->delete();

        // detach tags from conversations
        DB::table('taggables')
            ->whereIn('taggable_id', $conversationIds)
            ->where('taggable_type', Conversation::MODEL_TYPE)
            ->delete();

        // detach attributes
        DB::table('attributables')
            ->whereIn('attributable_id', $conversationIds)
            ->where('attributable_type', Conversation::MODEL_TYPE)
            ->delete();

        // delete ai agent sessions
        if (Schema::hasTable('ai_agent_sessions')) {
            DB::table('ai_agent_sessions')
                ->whereIn('conversation_id', $conversationIds)
                ->delete();
        }

        // delete conversation messages
        ConversationItem::query()->whereIn('id', $messageIds)->delete();

        // delete summaries
        if (Schema::hasTable('conversation_summaries')) {
            DB::table('conversation_summaries')
                ->whereIn('conversation_id', $conversationIds)
                ->delete();
        }

        // delete conversations
        Conversation::query()->whereIn('id', $conversationIds)->delete();
    }
}
