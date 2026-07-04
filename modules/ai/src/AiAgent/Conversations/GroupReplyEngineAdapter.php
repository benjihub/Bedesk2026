<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;
use Ai\AiAgent\Conversations\DefaultAIBehaviorController;

class GroupReplyEngineAdapter implements AIBehaviorController
{
    public function __construct(protected Conversation $conversation) {}

    public function handleLatestUserMessage(): void
    {
        (new DefaultAIBehaviorController($this->conversation))->handleLatestUserMessage();
    }
}