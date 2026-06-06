<?php

namespace Ai\AiAgent\Flows;

use App\Models\User;

class MessageBuilderData
{
    public function __construct(
        public readonly array $nodeConfig,
        public readonly array $allNodes,
        public readonly User $user,
    ) {
    }
}
