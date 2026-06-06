<?php namespace App\Conversations\Email\Parsing;

use App\Conversations\Messages\MessageBodyPurifier;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
use ZBateson\MailMimeParser\Message;

class ParsedEmail implements Jsonable, Arrayable
{
    public function __construct(protected array $email) {}

    /**
     * This will strip quoted replies from email and
     * remove any not allowed html tags.
     */
    public function getNormalizedBody(array $cidMap = []): string
    {
        // html was stripped already by email provider, just need to purify it
        if (
            $providedStrippedHtml =
                $this->email['body']['stripped-html'] ?? null
        ) {
            return (new MessageBodyPurifier())->emailBody(
                $this->cidToActualUrl($providedStrippedHtml, $cidMap),
            );
        }

        // we only have raw email mime, need to strip and purify it
        if ($this->hasBody('html')) {
            $strippedHtml = $this->getStrippedHtml('html', $cidMap);
            if ($strippedHtml) {
                return $strippedHtml;
            }
        }

        return $this->getStrippedHtml('plain', $cidMap);
    }

    protected function getStrippedHtml(string $type, array $cidMap): ?string
    {
        return (new StripAndPurifyEmailBody())->execute(
            $this->cidToActualUrl($this->getBody($type), $cidMap),
            $type,
        );
    }

    protected function cidToActualUrl(string $body, array $cidMap): string
    {
        foreach ($cidMap as $cid => $url) {
            $body = str_replace("cid:$cid", $url, $body);
        }
        return $body;
    }

    public function getSubject(): string
    {
        return $this->getHeader('Subject') ?: '(no subject)';
    }

    public function getSenderEmail(): string
    {
        $header = $this->getHeader('Reply-To') ?: $this->getHeader('From');

        // parse header and extract email address
        $email = Message::from("From: $header", false)
            ->getHeader('From')
            ->getEmail();

        if ($email) {
            return $email;
        }

        throw new InvalidArgumentException(
            "Could not extract email address from [$header]",
        );
    }

    public function getMessageId(): string|null
    {
        return $this->getHeader('Message-ID') ??
            ($this->getHeader('Message-Id') ?? null);
    }

    public function hasHeader(string $name): bool
    {
        return $this->getHeader($name) !== null;
    }

    public function getHeader(string $name): ?string
    {
        foreach ($this->getHeaders() as $header => $value) {
            if (strtolower($header) === strtolower($name)) {
                return $value;
            }
        }
        return null;
    }

    public function getHeaders(): array
    {
        return Arr::get($this->email, 'headers', []);
    }

    public function getBody(string $type): ?string
    {
        return Arr::get($this->email, "body.$type");
    }

    public function hasBody(string $type): bool
    {
        return Arr::get($this->email, "body.$type") !== null;
    }

    public function getAttachments(string $type): Collection
    {
        $attachments = Arr::get($this->email, 'attachments', []);

        // if attachment has a CID then it's inline, otherwise it's 'regular'
        return collect($attachments)->filter(function ($attachment) use (
            $type,
        ) {
            $cidEmbedded =
                Arr::get($attachment, 'cid') &&
                Str::contains($this->getBody('html'), $attachment['cid']);

            //if email body does not have attachment CID embedded, treat attachment as 'regular'
            if ($type === 'inline') {
                return $cidEmbedded;
            } else {
                return !$cidEmbedded;
            }
        });
    }

    public function toJson($options = 0): string
    {
        return json_encode($this->toArray(), $options);
    }

    public function toArray(): array
    {
        return [
            'headers' => $this->getHeaders(),
            'body' => [
                'plain' => $this->getBody('plain'),
                'html' => $this->getBody('html'),
            ],
        ];
    }
}
