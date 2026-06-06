<?php

namespace Ai\AiAgent\Flows;

use App\Conversations\Models\Conversation;
use App\Models\User;

/**
 * Minimal session context placeholder.
 *
 * The current codebase uses this class as a type reference from the livechat module.
 * Flow execution in this repo currently relies on stored node config + conversation state.
 */
class SessionContext
{
    public function __construct(
        public readonly Conversation $conversation,
        public readonly User $user,
        public array $data = [],
    ) {
    }
}
