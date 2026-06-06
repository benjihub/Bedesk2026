<?php namespace App\Conversations\Email\Mailables;

use App\Conversations\Email\EmailStore;
use App\Conversations\Email\TicketReferenceHash;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Common\Files\FileEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class TicketReplyMailable extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $reference;
    private string|null $previousEmailMessageId = null;
    public bool $includeHistory = false;

    public function __construct(
        public Conversation $conversation,
        public ConversationItem $reply,
    ) {
        $this->reference = (new TicketReferenceHash())->makeEmbedForEmail(
            $reply,
        );
    }

    public function build(): static
    {
        $this->conversation->load('user', 'latestMessages.user');
        $this->includeHistory = settings('tickets.include_history') ?? false;

        $this->setMessageIdForPreviousEmail();

        // make sure to get secondary email, if primary not available
        $this->to($this->conversation->user->routeNotificationForMail())
            ->subject("RE: {$this->conversation->subject}")
            ->view('tickets.ticket-reply.ticket-reply')
            ->text('tickets.ticket-reply.ticket-reply-plain');

        return $this;
    }

    public function attachments(): array
    {
        return $this->reply->attachments
            ->map(function (FileEntry $entry) {
                return Attachment::fromData(
                    fn() => $entry->getDisk()->get($entry->getStoragePath()),
                )
                    ->as($entry->name)
                    ->withMime($entry->mime);
            })
            ->toArray();
    }

    public function headers(): Headers
    {
        // Add ticket reference hash as in Message-ID header
        $messageId = (new TicketReferenceHash())->makeMessageIdForEmail(
            $this->reply,
        );

        $textHeaders = [
            'X-Ticket-Reference' => $this->reply->uuid,
        ];
        if ($this->previousEmailMessageId) {
            $textHeaders['In-Reply-To'] = $this->previousEmailMessageId;
        }

        // set in reply to and references headers so email client can thread properly
        return new Headers(
            messageId: $messageId,
            references: $this->previousEmailMessageId
                ? [$this->previousEmailMessageId]
                : [],
            text: $textHeaders,
        );
    }

    /**
     * Add attachments from latest ticket reply to email.
     */
    protected function addAttachments(): void
    {
        if ($this->reply->attachments->isEmpty()) {
            return;
        }

        $basePath = rtrim(
            $this->reply->attachments->first()->getDisk()->path(''),
            '/',
        );

        $this->reply->attachments->each(function (FileEntry $attachment) use (
            $basePath,
        ) {
            $this->attachFromStorage(
                $attachment->getStoragePath(),
                $attachment->name,
                [
                    'mime' => $attachment->mime,
                ],
            );
        });
    }

    protected function setMessageIdForPreviousEmail(): void
    {
        $previousMessage = $this->conversation->latestMessages
            ->where('type', 'message')
            ->where('user_id', '!=', $this->reply->user_id)
            ->where('id', '<', $this->reply->id)
            ->first();

        if ($previousMessage) {
            $this->previousEmailMessageId = $previousMessage->email_id;

            if (!$this->previousEmailMessageId) {
                $email = (new EmailStore())->getEmailForReply($previousMessage);
                $this->previousEmailMessageId =
                    $email['headers']['Message-ID'] ??
                    ($email['headers']['Message-Id'] ?? null);
            }
        }
    }
}
