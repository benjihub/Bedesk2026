<?php

namespace App\Conversations\Policies;

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Models\User;
use Common\Core\Policies\FileEntryPolicy;
use Common\Files\FileEntry;
use Illuminate\Support\Facades\DB;

class ConversationFileEntryPolicy extends FileEntryPolicy
{
    public function show(?User $user, FileEntry $entry): bool
    {
        if (!$user) {
            return false;
        }
        return $this->hasPermissionViaConversation($user, $entry);
    }

    public function download(?User $user, $entries): bool
    {
        if (!$user) {
            return false;
        }
        return $this->hasPermissionViaConversation($user, $entries[0]);
    }

    private function hasPermissionViaConversation(
        User $user,
        FileEntry $entry,
    ): bool {
        // Agents/admins that can manage conversations or tickets should be
        // able to see conversation attachments regardless of which customer
        // they belong to. This fixes the issue where agent accounts could not
        // load images in conversation views.
        if (
            $this->hasPermission($user, 'tickets.update') ||
            $this->hasPermission($user, 'conversations.update')
        ) {
            return true;
        }

        $values = DB::table('file_entry_models')
            ->where('file_entry_id', $entry->id)
            ->get();

        foreach ($values as $value) {
            if (
                $value->model_type === User::MODEL_TYPE &&
                $value->model_id === $user->id
            ) {
                return true;
            }

            $conversationId = ConversationItem::query()
                ->where('id', $value->model_id)
                ->value('conversation_id');

            $conversation = Conversation::find($conversationId);

            if ($conversation && $conversation->user_id === $user->id) {
                return true;
            }
        }

        return false;
    }
}
