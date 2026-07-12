<?php namespace App\Billing\Listeners;

use App\Billing\Models\AiBillingUsageLedger;
use App\Billing\Services\AiBillingAccountResolver;
use App\Billing\Services\AiReplyQuotaService;
use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Models\Conversation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class RecordAiReplyBillingUsage
{
    public function handle(ConversationMessageCreated $event): void
    {
        $message = $event->message;

        if (
            $message->type !== 'message' ||
            $message->author !== Conversation::AUTHOR_BOT ||
            trim((string) $message->body) === ''
        ) {
            return;
        }

        if (!Schema::hasTable('ai_billing_accounts')) {
            return;
        }

        try {
            $alreadyRecorded = AiBillingUsageLedger::query()
                ->where('message_id', $message->id)
                ->where('usage_type', 'ai_reply')
                ->exists();

            if ($alreadyRecorded) {
                return;
            }

            $account = app(AiBillingAccountResolver::class)->resolve();
            $quota = app(AiReplyQuotaService::class);

            if (!$quota->canConsume($account)) {
                return;
            }

            $quota->recordSuccessfulReply($account, [
                'conversation_id' => $event->conversation->id,
                'ai_agent_id' => $this->resolveAiAgentId($event->conversation),
                'message_id' => $message->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record AI reply billing usage from event: '.$e->getMessage(), [
                'conversation_id' => $event->conversation->id,
                'message_id' => $message->id,
            ]);
        }
    }

    private function resolveAiAgentId(Conversation $conversation): ?int
    {
        if (
            !class_exists(\Ai\AiAgent\Models\AiAgent::class) ||
            !Schema::hasTable('ai_agents')
        ) {
            return null;
        }

        $query = \Ai\AiAgent\Models\AiAgent::query()->where('enabled', true);
        $groupId = $conversation->group_id ? (int) $conversation->group_id : null;

        if ($groupId) {
            $groupAgent = (clone $query)
                ->where('group_id', $groupId)
                ->orderBy('id')
                ->first();

            if ($groupAgent) {
                return $groupAgent->id;
            }
        }

        return $query
            ->whereNull('group_id')
            ->orderBy('id')
            ->value('id');
    }
}
