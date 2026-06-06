<?php

namespace Ai\AiAgent\Flows\Nodes;

use Ai\AiAgent\Flows\MessageBuilderData;
use Illuminate\Support\Arr;

class ButtonsNode extends BaseNode
{
    public static bool $canUseAsGreetingNode = true;
    public static bool $waitsForUserInput = true;

    public static function buildConversationMessagesData(
        MessageBuilderData $data,
    ): array {
        $node = $data->nodeConfig;
        $nodeData = Arr::get($node, 'data', []);

        $parentId = Arr::get($node, 'id');
        $buttons = [];
        foreach ($data->allNodes as $n) {
            if (
                Arr::get($n, 'parentId') === $parentId &&
                Arr::get($n, 'type') === 'buttonsItem'
            ) {
                $name = Arr::get($n, 'data.name');
                if (is_string($name) && $name !== '') {
                    $buttons[] = [
                        'id' => Arr::get($n, 'id'),
                        'name' => $name,
                    ];
                }
            }
        }

        $message = Arr::get($nodeData, 'message', 'Select one of these options');
        if (!is_string($message)) {
            $message = '';
        }

        return [
            [
                'type' => 'message',
                'body' => $message,
                'data' => ['buttons' => $buttons],
                'attachments' => Arr::get($nodeData, 'attachmentIds', []),
            ],
        ];
    }
}
