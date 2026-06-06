<?php namespace App\Triggers\Actions;

use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;
use Common\Tags\Tag;

class AddTagsToConversationAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $tags = $action['value']['tags_to_add'];
        $tags = is_array($tags) ? $tags : explode(',', $tags);

        $tags = app(Tag::class)->insertOrRetrieve($tags, null);

        $conversation
            ->tags()
            ->syncWithoutDetaching($tags->pluck('id')->toArray());

        //'unload' tags relationship in case it was already loaded
        //on passed in conversation so removed tags are properly removed
        //the next time tags relationship is accessed on this conversation
        unset($conversation->tags);

        return $conversation;
    }
}
