<?php namespace App\Conversations\Email;

use App\Conversations\Agent\Notifications\TicketIsLocked;
use App\Conversations\Agent\Notifications\TicketRejected;
use App\Conversations\Customer\Actions\CreateTicketAsCustomer;
use App\Conversations\Customer\Actions\SubmitMessageAsCustomer;
use App\Conversations\Email\Parsing\ParsedEmail;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Models\User;
use Common\Auth\Actions\CreateUser;
use Common\Files\Actions\CreateFileEntry;
use Common\Files\Actions\StoreFile;
use Common\Files\FileEntry;
use Common\Files\FileEntryPayload;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class TransformEmailIntoTicketOrReply
{
    public function __construct(protected ParsedEmail $parsedEmail) {}

    public function execute(array $options = []): void
    {
        $createNewTickets =
            $options['createNewTickets'] ??
            settings('tickets.create_from_emails');
        $createReplies =
            $options['createReplies'] ?? settings('replies.create_from_emails');
        $ticket = $this->getTicketEmailIsInReplyTo();

        // prevent replies from the same email from being created
        $emailId = $this->parsedEmail->getMessageId();
        if (
            $emailId &&
            ConversationItem::where('email_id', $emailId)->exists()
        ) {
            return;
        }

        if (
            $ticket &&
            $ticket?->status_category <= Conversation::STATUS_LOCKED
        ) {
            Notification::route(
                'mail',
                $this->parsedEmail->getSenderEmail(),
            )->notify(new TicketIsLocked($ticket));
            return;
        }

        // create new ticket from email
        if (!$ticket && $createNewTickets) {
            $newTicket = $this->createTicketFromEmail();
            $reply = $newTicket->messages()->first();
        }

        // create reply for existing ticket from email
        if ($ticket && $createReplies) {
            $reply = $this->createReplyFromEmail($ticket);
        }

        if (!$ticket && !$createNewTickets) {
            $this->maybeSendTicketRejectedNotification();
        }

        $this->storeOriginalEmail($reply ?? null);
    }

    private function getTicketEmailIsInReplyTo(): ?Conversation
    {
        $reply = null;
        $referenceHash = new TicketReferenceHash();

        if ($this->parsedEmail->hasHeader('In-Reply-To')) {
            $inReplyToMessageId = $this->parsedEmail->getHeader('In-Reply-To');
            $uuid = $referenceHash->extractFromMessageId($inReplyToMessageId);
            // find reply either by email message ID or by BeDesk specific UUID for reply
            $reply = ConversationItem::when(
                $uuid,
                fn($builder) => $builder->where('uuid', $uuid),
            )
                ->orWhere('email_id', $inReplyToMessageId)
                ->first();
        }

        if (!$reply && $this->parsedEmail->hasBody('plain')) {
            $uuid = $referenceHash->extractFromString(
                $this->parsedEmail->getBody('plain'),
            );
            if ($uuid) {
                $reply = ConversationItem::where('uuid', $uuid)->first();
            }
        }

        if (!$reply && $this->parsedEmail->hasBody('html')) {
            $uuid = str_replace(
                '<wbr>',
                '',
                $referenceHash->extractFromString(
                    $this->parsedEmail->getBody('html'),
                ),
            );
            if ($uuid) {
                $reply = ConversationItem::where('uuid', $uuid)->first();
            }
        }

        return $reply?->conversation;
    }

    private function createTicketFromEmail(): Conversation
    {
        $email = $this->parsedEmail->getSenderEmail();
        $user =
            User::where(['email' => $email])->first() ??
            (new CreateUser())->execute(['email' => $email]);

        $cidMap = $this->generateCidMap($user->id);

        return (new CreateTicketAsCustomer())->execute(
            [
                'subject' => $this->parsedEmail->getSubject(),
                'message' => [
                    'body' => $this->parsedEmail->getNormalizedBody($cidMap),
                    'attachments' => $this->getEntryIdsFromAttachments(
                        $user->id,
                    ),
                    'email_id' => $this->parsedEmail->getMessageId(),
                ],
                'channel' => 'email',
                'received_at_email' =>
                    $this->parsedEmail->getHeader('Delivered-To') ??
                    $this->parsedEmail->getHeader('To'),
            ],
            $user,
        );
    }

    private function createReplyFromEmail(
        Conversation $conversation,
    ): ConversationItem {
        $cidMap = $this->generateCidMap($conversation->user_id);

        return (new SubmitMessageAsCustomer())->execute($conversation, [
            'body' => $this->parsedEmail->getNormalizedBody($cidMap),
            'user_id' => $conversation->user_id,
            'attachments' => $this->getEntryIdsFromAttachments(
                $conversation->user_id,
            ),
            'email_id' => $this->parsedEmail->getMessageId(),
        ]);
    }

    /**
     * Store inline images and generate CID map for them.
     */
    private function generateCidMap(int $userId): array
    {
        $inlineAttachments = $this->parsedEmail->getAttachments('inline');

        return $inlineAttachments
            ->mapWithKeys(function ($attachment) use ($userId) {
                $fileEntry = $this->storeAttachment(
                    $attachment,
                    userId: $userId,
                    uploadType: Conversation::IMAGE_UPLOAD_TYPE,
                );
                return [$attachment['cid'] => url($fileEntry->url)];
            })
            ->toArray();
    }

    private function getEntryIdsFromAttachments(int $userId): array
    {
        $attachments = $this->parsedEmail->getAttachments('regular');

        $uploadIds = $attachments
            ->filter(function ($attachment) {
                return Arr::get($attachment, 'original_name');
            })
            ->map(function ($attachment) use ($userId) {
                $fileEntry = $this->storeAttachment(
                    $attachment,
                    userId: $userId,
                    uploadType: Conversation::ATTACHMENT_UPLOAD_TYPE,
                );
                return $fileEntry->id;
            });

        return $uploadIds->values()->toArray();
    }

    protected function storeAttachment(
        array $attachment,
        int $userId,
        string $uploadType,
    ): FileEntry {
        $payload = new FileEntryPayload([
            'clientName' => $attachment['original_name'],
            'clientMime' => $attachment['mime_type'],
            'clientExtension' => $attachment['extension'],
            'clientSize' => $attachment['size'],
            'ownerId' => $userId,
            'uploadType' => $uploadType,
        ]);
        (new StoreFile())->execute($payload, [
            'contents' => $attachment['contents'],
        ]);
        return (new CreateFileEntry())->execute($payload);
    }

    private function storeOriginalEmail(
        ConversationItem|null $reply = null,
    ): void {
        (new EmailStore())->storeEmail($this->parsedEmail, $reply);
    }

    /**
     * Send rejected notification to sender if
     * ticket creation via email channel is disabled.
     */
    private function maybeSendTicketRejectedNotification(): void
    {
        if (settings('tickets.send_ticket_rejected_notification')) {
            Notification::route(
                'mail',
                $this->parsedEmail->getSenderEmail(),
            )->notify(new TicketRejected());
        }
    }
}
