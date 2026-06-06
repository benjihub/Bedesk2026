<?php

namespace App\Features\Whatsapp\Listeners;

use App\Conversations\Events\ConversationTyping;
use App\Conversations\Models\Conversation;
use App\Features\Whatsapp\Application\Services\WhatsappMessageService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendTypingToWhatsapp
{
    public function __construct(
        private WhatsappMessageService $whatsappMessageService,
    ) {
    }

    public function handle(ConversationTyping $event): void
    {
        $conversation = $event->conversation;

        if ($conversation->channel !== 'whatsapp') {
            return;
        }

        // Forward typing only from agent/bot side to WhatsApp customer.
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

        $messageId = $recipient['provider_message_id'] ?? null;
        $accountId = $recipient['account_id'] ?? null;

        if (!$messageId) {
            return;
        }

        // Prevent flooding WhatsApp typing endpoint while user is still typing.
        $throttleKey = "whatsapp:typing:{$conversation->id}:{$messageId}";
        if (!Cache::add($throttleKey, 1, now()->addSeconds(4))) {
            return;
        }

        try {
            $this->whatsappMessageService->sendTypingIndicator(
                messageId: (string) $messageId,
                accountId: is_numeric($accountId) ? (int) $accountId : null,
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to send WhatsApp typing indicator', [
                'conversation_id' => $conversation->id,
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function getRecipientFromConversation(Conversation $conversation): ?array
    {
        $messageWithData = $conversation->messages()
            ->whereNotNull('data')
            ->where('data->provider', 'whatsapp')
            ->where('author', Conversation::AUTHOR_USER)
            ->latest('id')
            ->first();

        if ($messageWithData && isset($messageWithData->data['whatsapp'])) {
            return $messageWithData->data['whatsapp'];
        }

        return null;
    }
}
