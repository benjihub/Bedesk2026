<?php

namespace Livechat\Chats;

use Ai\AiAgent\Models\AiAgentSession;
use App\Attributes\Models\CustomAttribute;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Models\User;
use App\Team\Models\Group;
use Illuminate\Support\Collection;

class StoreChatFormData
{
    public function execute(
        string $formType,
        Conversation $conversation,
        array $formData,
    ): ConversationItem {
        $user = $conversation->user;

        $attributes = CustomAttribute::query()
            ->whereIn('key', array_keys($formData))
            ->get()
            ->map(
                fn($attribute) => [
                    ...$attribute->getAttributes(),
                    'value' => $formData[$attribute->key],
                ],
            );

        $groupedAttributes = $attributes->groupBy('type')->map->mapWithKeys(
            fn($attribute) => [
                $attribute['key'] => $attribute['value'],
            ],
        );

        foreach ($groupedAttributes as $type => $group) {
            if ($type === User::MODEL_TYPE && $group->isNotEmpty()) {
                $user->updateCustomAttributes($group);
            }

            if ($type === Conversation::MODEL_TYPE && $group->isNotEmpty()) {
                $conversation->updateCustomAttributes($group);
            }

            if ($type === AiAgentSession::MODEL_TYPE && $group->isNotEmpty()) {
                $conversation->AiAgentSession?->updateCustomAttributes($group);
            }
        }

        return (new CreateConversationMessage())->execute($conversation, [
            'type' => 'submittedFormData',
            'author' => 'user',
            'body' => [
                'formType' => $formType,
                'attributes' => $this->encodeAttributeValuesAsJson($attributes),
            ],
        ]);
    }

    public function encodeAttributeValuesAsJson(Collection $values): array
    {
        return $values
            ->map(function ($attribute) {
                $value = $attribute['value'];
                if ($attribute['key'] === 'group_id') {
                    $group = Group::find($value);
                    if ($group && $group->name) {
                        $value = $group->name;
                    }
                }
                return [
                    'key' => $attribute['key'],
                    'name' => $attribute['name'],
                    'format' => $attribute['format'],
                    'value' => $value,
                ];
            })
            ->toArray();
    }
}
