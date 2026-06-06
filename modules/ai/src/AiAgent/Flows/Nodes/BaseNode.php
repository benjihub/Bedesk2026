<?php

namespace Ai\AiAgent\Flows\Nodes;

use Ai\AiAgent\Flows\MessageBuilderData;

abstract class BaseNode
{
    public static bool $canUseAsGreetingNode = false;
    public static bool $waitsForUserInput = false;

    /**
     * Return an array of message payload fragments.
     * Each fragment should contain at minimum: ['type' => 'message', 'body' => string]
     */
    public static function buildConversationMessagesData(
        MessageBuilderData $data,
    ): array {
        return [];
    }
}
