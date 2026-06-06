<?php namespace App\Conversations\Email\Transformers;

use ZBateson\MailMimeParser\Message;

class MimeMailTransformer
{
    public function transform(string $emailData): array
    {
        $message = Message::from($emailData, false);

        $parsed = [
            'headers' => [],
            'body' => [
                'html' => '',
                'plain' => '',
            ],
            'attachments' => [],
        ];

        foreach ($message->getAllHeaders() as $header) {
            $parsed['headers'][$header->getName()] = $header->getValue();
        }

        $parsed['body']['html'] = $message->getHtmlContent();
        $parsed['body']['plain'] = $message->getTextContent();

        foreach ($message->getAllAttachmentParts() as $attachment) {
            $content = $attachment->getContent();
            $parsed['attachments'][] = [
                'contents' => $content,
                'original_name' => $attachment->getFilename(),
                'mime_type' => $attachment->getContentType(),
                'size' => strlen($content),
                'extension' => pathinfo(
                    $attachment->getFilename(),
                    PATHINFO_EXTENSION,
                ),
                'cid' => $attachment->getContentId(),
            ];
        }

        return $parsed;
    }
}
