<?php

namespace Ai\AiAgent\Flows\Nodes;

use Ai\AiAgent\Flows\MessageBuilderData;
use Illuminate\Support\Arr;

class MessageNode extends BaseNode
{
    public static bool $canUseAsGreetingNode = true;

    public static function buildConversationMessagesData(
        MessageBuilderData $data,
    ): array {
        $nodeData = Arr::get($data->nodeConfig, 'data', []);
        $message = Arr::get($nodeData, 'message');

        if (!is_string($message) || $message === '') {
            return [];
        }

        return [
            [
                'type' => 'message',
                'body' => $message,
                'data' => null,
                'attachments' => Arr::get($nodeData, 'attachmentIds', []),
            ],
        ];
    }
}
