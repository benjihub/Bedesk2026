<?php

namespace Ai\AiAgent\Conversations;

interface AIBehaviorController
{
    public function handleLatestUserMessage(): void;
}