<?php namespace App\Triggers\Actions;

use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;
use Common\Tags\Tag;

class RemoveTagsFromConversationAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $tagNames = $action['value']['tags_to_remove'];
        $tagNames = is_array($tagNames) ? $tagNames : explode(',', $tagNames);
        $tags = Tag::whereIn('name', $tagNames)->get();

        $conversation->tags()->detach($tags->pluck('id')->toArray());

        //'unload' tags relationship in case it was already loaded
        //on passed in conversation so removed tags are properly removed
        //the next time tags relationship is accessed on this conversation
        unset($conversation->tags);

        return $conversation;
    }
}
