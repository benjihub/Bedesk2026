<?php

namespace App\Features\Line\Listeners;

use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Models\Conversation;
use App\Features\Line\Application\Services\LineMessageService;
use App\Features\Line\Domain\DTO\OutgoingMessage;
use Illuminate\Support\Facades\Log;

class SendMessageToLine
{
    public function __construct(private LineMessageService $lineMessageService) {}

    public function handle(ConversationMessageCreated $event): void
    {
        $conversation = $event->conversation;
        $message = $event->message;

        if ($conversation->channel !== 'line') {
            return;
        }

        if (!in_array($message->author, [Conversation::AUTHOR_AGENT, Conversation::AUTHOR_BOT], true)) {
            return;
        }

        $recipient = $this->getRecipientFromConversation($conversation);

        if (!$recipient) {
            Log::warning('Could not find recipient for LINE conversation', ['conversation_id' => $conversation->id]);
            return;
        }

        $accountId = $recipient['account_id'] ?? null;
        $to = $recipient['contact_id'] ?? $recipient['from'] ?? null;

        if (!$to) {
            Log::warning('Could not determine LINE destination id', ['conversation_id' => $conversation->id]);
            return;
        }

        try {
            $plainText = trim(strip_tags((string) $message->body));
            if ($plainText === '') {
                return;
            }

            $outgoing = OutgoingMessage::fromArray([
                'to' => (string) $to,
                'type' => 'text',
                'body' => $plainText,
                'account_id' => $accountId,
            ]);

            $this->lineMessageService->sendMessage($outgoing);
        } catch (\Throwable $e) {
            Log::error('Failed to send message to LINE', ['error' => $e->getMessage(), 'conversation_id' => $conversation->id, 'message_id' => $message->id]);
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
