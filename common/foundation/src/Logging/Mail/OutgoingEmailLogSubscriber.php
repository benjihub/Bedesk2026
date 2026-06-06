<?php

namespace Common\Logging\Mail;

use Common\Logging\Mail\OutgoingEmailLogItem;
use Exception;
use Illuminate\Events\Dispatcher;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Log;
use Throwable;
use ZBateson\MailMimeParser\Message;

class OutgoingEmailLogSubscriber
{
    public function handleSending(MessageSending $event): void
    {
        // converting symfony message to string can be expensive for some emails
        @ini_set('max_execution_time', 300);

        // make sure any logic exceptions from symfony don't break the app
        try {
            $headers = $event->message->getPreparedHeaders();
        } catch (Exception $e) {
            return;
        }

        try {
            $parsedMessage = Message::from($event->message->toString(), true);
        } catch (Throwable $e) {
            Log::error($e);
            return;
        }

        foreach (
            $parsedMessage->getAllAttachmentParts()
            as $index => $attachment
        ) {
            // only store attachments that are less than 500KB
            if (strlen($attachment->getContent()) > 500000) {
                $parsedMessage->removeAttachmentPart($index);
            }
        }

        try {
            $logItem = OutgoingEmailLogItem::create([
                'message_id' => $headers->get('Message-ID')->getBodyAsString(),
                'from' => $headers->get('From')->getBodyAsString(),
                'to' => $headers->get('To')->getBodyAsString(),
                'subject' => $headers->get('Subject')->getBodyAsString(),
                'mime' => utf8_encode((string) $parsedMessage),
                'status' => 'not-sent',
            ]);
        } catch (Throwable $e) {
            Log::error($e);
            return;
        }

        $event->message
            ->getHeaders()
            ->addTextHeader('X-BE-LOG-ID', $logItem->id);
    }

    public function handleSent(MessageSent $event): void
    {
        $logId = $event->message
            ->getHeaders()
            ->get('X-BE-LOG-ID')
            ->getBodyAsString();

        OutgoingEmailLogItem::where('id', $logId)->update([
            'status' => 'sent',
            'message_id' => $event->sent
                ->getSymfonySentMessage()
                ->getMessageId(),
        ]);
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            MessageSending::class => 'handleSending',
            MessageSent::class => 'handleSent',
        ];
    }
}
