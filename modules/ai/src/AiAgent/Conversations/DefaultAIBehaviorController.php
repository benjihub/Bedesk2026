<?php

namespace Ai\AiAgent\Conversations;

use App\Conversations\Models\Conversation;

class DefaultAIBehaviorController implements AIBehaviorController
{
    public function __construct(protected Conversation $conversation) {}

    public function handleLatestUserMessage(): void
    {
        (new GroupReplyEngine($this->conversation))->handleLatestUserMessage();
    }
}