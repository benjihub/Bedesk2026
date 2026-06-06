<?php

namespace App\Conversations\Agent\Actions;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MergeConversations
{
    public function execute(
        Conversation $conversation,
        Collection $toMerge,
    ): void {
        // merge conversation content (without touching timestamps)
        DB::table(app(ConversationItem::class)->getTable())
            ->whereIn('conversation_id', $toMerge->pluck('id'))
            ->update(['conversation_id' => $conversation->id]);

        // merge tags
        $oldTagIds = DB::table('taggables')
            ->whereIn('taggable_id', $toMerge->pluck('id'))
            ->where('taggable_type', Conversation::MODEL_TYPE)
            ->pluck('tag_id');
        $currentTagIds = $conversation->tags->pluck('id');
        DB::table('taggables')
            ->whereIn('taggable_id', $toMerge->pluck('id'))
            ->where('taggable_type', Conversation::MODEL_TYPE)
            ->delete();
        $conversation->tags()->sync(
            $oldTagIds
                ->merge($currentTagIds)
                ->unique()
                ->unique(),
        );

        // merge attributes
        $oldAttributeIds = DB::table('attributables')
            ->whereIn('attributable_id', $toMerge->pluck('id'))
            ->where('attributable_type', Conversation::MODEL_TYPE)
            ->pluck('attribute_id');
        $currentAttributeIds = $conversation->customAttributes->pluck('id');
        DB::table('attributables')
            ->whereIn('attributable_id', $toMerge->pluck('id'))
            ->where('attributable_type', Conversation::MODEL_TYPE)
            ->delete();
        $conversation->customAttributes()->sync(
            $oldAttributeIds
                ->merge($currentAttributeIds)
                ->unique()
                ->unique(),
        );

        // delete merged conversations
        (new DeleteMultipleConversations())->execute($toMerge->pluck('id'));
    }
}
