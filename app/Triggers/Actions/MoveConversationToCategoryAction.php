<?php namespace App\Triggers\Actions;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;

class MoveConversationToCategoryAction implements TriggerActionInterface
{
    public function execute(
        Conversation $conversation,
        array $action,
        Trigger $trigger,
    ): Conversation {
        $categoryAttribute = CustomAttribute::where('key', 'category')->first();
        if (!$categoryAttribute) {
            return $conversation;
        }

        $conversation->customAttributes()->detach($categoryAttribute);

        $conversation->customAttributes()->attach($categoryAttribute, [
            'value' => $action['value']['category_name'],
        ]);

        //'unload' attributes relationship in case it was already loaded
        //on passed in conversation so removed attributes are properly removed
        //the next time attributes relationship is accessed on this conversation
        unset($conversation->customAttributes);

        return $conversation;
    }
}
