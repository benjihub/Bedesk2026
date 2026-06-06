<?php

namespace Livechat\Controllers;

use App\Conversations\Models\Conversation;
use Common\Core\BaseController;

class ChatTranscriptController extends BaseController
{
    public function __invoke(int $chatId)
    {
        $conversation = Conversation::with('user')->findOrFail($chatId);

        $this->authorize('show', $conversation);

        $appName = config('app.name');

        $transcript = "$appName conversation transcript\n----------------\n";

        $conversation
            ->messages()
            ->with('user')
            ->latest()
            ->chunk(100, function ($messages) use (&$transcript, $conversation) {
                foreach ($messages as $message) {
                    $date = $message->created_at->format('Y-m-d H:i:s');
                    $name =
                        $message->user->name ??
                        ($conversation->visitor->name ?? 'Visitor');
                    $transcript .= "$name ($date)\n{$message->body}\n\n";
                }
            });

        return response()->streamDownload(function () use ($transcript) {
            echo $transcript;
        }, "conversation_transcript-{$conversation->id}.txt");
    }
}
