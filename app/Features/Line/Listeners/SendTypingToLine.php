<?php

namespace App\Features\Line\Listeners;

use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use App\Features\Line\Application\Services\LineMessageService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendTypingToLine
{
    public function __construct(private LineMessageService $lineMessageService)
    {
    }

    public function handle(ConversationTyping $event): void
    {
        $conversation = $event->conversation;

        if ($conversation->channel !== 'line') {
            return;
        }

        // Forward typing only from agent/bot side to LINE customer.
        if (!in_array($event->author, [Conversation::AUTHOR_AGENT, Conversation::AUTHOR_BOT], true)) {
            return;
        }

        if (!$event->isTyping) {
            return;
        }

        $recipient = $this->getRecipientFromConversation($conversation);
        if (!$recipient) {
            return;
        }

        $to = $recipient['contact_id'] ?? $recipient['from'] ?? null;
        $accountId = $recipient['account_id'] ?? null;

        if (!$to) {
            return;
        }

        // Prevent flooding LINE typing endpoint while user is still typing.
        $throttleKey = "line:typing:{$conversation->id}:{$to}";
        if (!Cache::add($throttleKey, 1, now()->addSeconds(4))) {
            return;
        }

        try {
            $seconds = (int) config('line.typing_seconds', 5);
            $this->lineMessageService->sendTypingIndicator(
                to: (string) $to,
                accountId: is_numeric($accountId) ? (int) $accountId : null,
                loadingSeconds: $seconds,
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to send LINE typing indicator', [
                'conversation_id' => $conversation->id,
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getRecipientFromConversation(Conversation $conversation): ?array
    {
        $messageWithData = $conversation->messages()
            ->whereNotNull('data')
            ->where('data->provider', 'line')
            ->latest('id')
            ->first();

        if ($messageWithData && isset($messageWithData->data['line'])) {
            return $messageWithData->data['line'];
        }

        return null;
    }
}
