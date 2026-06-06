<?php namespace App\Conversations\Email;

use App\Conversations\Email\Parsing\ParsedEmail;
use App\Conversations\Models\ConversationItem;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EmailStore
{
    public function storeEmail(
        ParsedEmail $parsedEmail,
        ConversationItem|null $reply = null,
    ): void {
        //if email was matched to existing ticket, we will use reply UUID
        //as file name, so we can later match it to corresponding reply
        if ($reply) {
            $path = $this->makeMatchedEmailPath($reply);

            //otherwise we will store email into "unmatched" directory
        } else {
            $path = $this->makeUnmatchedEmailPath();
        }

        file_put_contents($path, $parsedEmail->toJson());
    }

    public function getEmailForReply(ConversationItem $reply): ?array
    {
        $path = $this->makeMatchedEmailPath($reply);

        if (!file_exists($path)) {
            return null;
        }

        return json_decode(file_get_contents($path), true);
    }

    public function download(ConversationItem $message)
    {
        $path = $this->makeMatchedEmailPath($message);

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->download($path);
    }

    private function makeMatchedEmailPath(ConversationItem $message): string
    {
        $date = $message->created_at;
        $dir = storage_path(
            "app/emails/matched/{$date->year}/{$date->month}/{$date->day}",
        );
        File::ensureDirectoryExists($dir);
        return "$dir/$message->uuid.json";
    }

    private function makeUnmatchedEmailPath(): string
    {
        $date = now();
        $name = "{$date->hour}:{$date->minute}" . Str::random(30);
        $dir = storage_path(
            "app/emails/unmatched/{$date->year}/{$date->month}/{$date->day}",
        );
        File::ensureDirectoryExists($dir);
        return "$dir/{$name}.json";
    }
}
