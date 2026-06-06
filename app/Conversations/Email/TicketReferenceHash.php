<?php namespace App\Conversations\Email;

use App\Conversations\Models\ConversationItem;

class TicketReferenceHash
{
    /**
     * Make reference hash string embed for email.
     */
    public function makeEmbedForEmail(ConversationItem $reply): string
    {
        return "|reference=$reply->uuid|";
    }

    /**
     * Create message id for email with ticket and reply reference embedded.
     */
    public function makeMessageIdForEmail(ConversationItem $reply): string
    {
        $host = parse_url(config('app.url'))['host'];

        return "{$reply->uuid}@$host";
    }

    /**
     * Extract ticket reference from specified string;
     */
    public function extractFromString(string $string): ?string
    {
        preg_match('/\|reference=(.+?)\|/', $string, $matches);

        return $matches[1] ?? null;
    }

    /**
     * Extract reply UUID from email Message-ID header.
     */
    public function extractFromMessageId(string $string): string
    {
        $uuid = explode('@', $string)[0];

        return str_replace(['<', '>'], '', $uuid);
    }
}
