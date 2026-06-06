<?php

namespace App\Features\Whatsapp\Listeners;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Models\Conversation;
use App\Features\Whatsapp\Application\Services\WhatsappMessageService;
use App\Features\Whatsapp\Domain\DTO\OutgoingMessage;
use Illuminate\Support\Facades\Log;

class SendMessageToWhatsapp
{
    public function __construct(
        protected WhatsappMessageService $messageService,
    ) {
    }

    /**
     * Send a message back to WhatsApp when a conversation reply is created.
     */
    public function handle(ConversationMessageCreated $event): void
    {
        $message = $event->message;
        $conversation = $message->conversation;

        if ($conversation->channel !== 'whatsapp') {
            return;
        }

        // Only send replies created by agents or bots.
        if (!in_array($message->author, [Conversation::AUTHOR_AGENT, Conversation::AUTHOR_BOT], true)) {
            return;
        }

        try {
            $recipient = $this->getRecipientFromConversation($conversation);
            $to = $recipient['contact_id'] ?? $recipient['from'] ?? null;

            if (!$to) {
                Log::warning('Could not determine WhatsApp recipient', ['conversation_id' => $conversation->id]);
                return;
            }

            $plainText = trim(strip_tags((string) $message->body));
            if ($plainText === '') {
                return;
            }

            $outgoing = new OutgoingMessage(
                to: (string) $to,
                type: 'text',
                body: $plainText,
                accountId: $recipient['account_id'] ?? null,
                previewUrl: false,
            );

            $this->messageService->sendMessage($outgoing);
        } catch (\Throwable $e) {
            Log::error('Failed to send WhatsApp message', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
            ]);
        }
    }

    private function getRecipientFromConversation(Conversation $conversation): ?array
    {
        $messageWithData = $conversation->messages()
            ->whereNotNull('data')
            ->where('data->provider', 'whatsapp')
            ->latest('id')
            ->first();

        if ($messageWithData && isset($messageWithData->data['whatsapp'])) {
            return $messageWithData->data['whatsapp'];
        }

        return null;
    }
}
