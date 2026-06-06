<?php namespace App\Conversations\Email\Transformers;

use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class MailgunMailTransformer
{
    /**
     * Raw mailgun email data.
     */
    private array $emailData;

    public function transform(array $emailData): array
    {
        $this->emailData = $emailData;
        $attachments = $this->transformAttachments();

        return [
            'headers' => $this->transformHeaders(),
            'body' => [
                'plain' => Arr::get($emailData, 'body-plain'),
                'stripped-html' => Arr::get($emailData, 'stripped-html'),
                'html' => Arr::get($emailData, 'body-html'),
            ],
            'attachments' => $attachments,
        ];
    }

    /**
     * Transform mailgun headers into key => value array.
     */
    public function transformHeaders(): array
    {
        $headers = Arr::get($this->emailData, 'message-headers', []);

        if (!is_array($headers)) {
            $headers = json_decode($headers, true);
        }

        return collect($headers)
            ->mapWithKeys(function ($value) {
                return [
                    $value[0] => $this->convertHeaderValueToString($value[1]),
                ];
            })
            ->toArray();
    }

    /**
     * Convert mailgun header value into string if it's an array.
     */
    private function convertHeaderValueToString($value): string
    {
        if (!is_array($value)) {
            return $value;
        }

        try {
            $value = Arr::flatten($value);
            $value = $value[0] . '; ' . $value[1];
        } catch (Exception $e) {
            $value = 'Error parsing header';
        }

        return $value;
    }

    /**
     * Transform mailgun attachments into array.
     */
    private function transformAttachments(): array
    {
        $attachments = Arr::get($this->emailData, 'attachments', []);

        if (is_string($attachments)) {
            $attachments = json_decode($attachments, true);
        }

        return array_map(function ($attachment) {
            $contents = $this->getRemoteAttachmentContents($attachment['url']);
            return [
                'original_name' => $attachment['name'],
                'mime_type' => $attachment['content-type'],
                'size' => $attachment['size'],
                'contents' => $contents,
                'extension' => explode('/', $attachment['content-type'])[1],
                'cid' => $this->getAttachmentCid($attachment),
            ];
        }, $attachments);
    }

    /**
     * Find attachment CID if it's an inline attachment.
     */
    private function getAttachmentCid(array $attachment): ?string
    {
        $cidMap = Arr::get($this->emailData, 'content-id-map', []);

        if (is_string($cidMap)) {
            $cidMap = json_decode($cidMap, true);
        }

        foreach ($cidMap as $cid => $cidAttachment) {
            $url = is_array($cidAttachment)
                ? $cidAttachment['url']
                : $cidAttachment;

            if ($url === $attachment['url']) {
                return str_replace(['<', '>'], '', $cid);
            }
        }

        return null;
    }

    /**
     * Download specified attachment contents via mailgun API.
     */
    private function getRemoteAttachmentContents(string $url): ?string
    {
        $response = Http::withBasicAuth(
            'api',
            config('services.mailgun.secret'),
        )->get($url);
        return $response->body() ?? null;
    }
}
