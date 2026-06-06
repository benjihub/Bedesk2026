<?php

namespace App\Core\Listeners;

use App\CannedReplies\Models\CannedReply;
use App\Conversations\Agent\Actions\DeleteMultipleConversations;
use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Auth\Events\UsersDeleted;
use Illuminate\Support\Facades\DB;

class DeleteUserRelations
{
    public function handle(UsersDeleted $event): void
    {
        $userIds = $event->users->pluck('id');

        // emails
        DB::table('emails')->whereIn('user_id', $userIds)->delete();

        // details
        DB::table('user_details')->whereIn('user_id', $userIds)->delete();

        // purchase codes
        DB::table('purchase_codes')->whereIn('user_id', $userIds)->delete();

        // conversations
        $conversationIds = Conversation::query()
            ->whereIn('user_id', $userIds)
            ->pluck('id');
        (new DeleteMultipleConversations())->execute($conversationIds);

        // canned replies
        CannedReply::whereIn('user_id', $userIds)->delete();

        // detach tags
        DB::table('taggables')
            ->whereIn('taggable_id', $userIds)
            ->where('taggable_type', User::MODEL_TYPE)
            ->delete();

        // delete page visits
        DB::table('page_visits')->whereIn('user_id', $userIds)->delete();

        // delete secondary emails
        DB::table('emails')->whereIn('user_id', $userIds)->delete();
    }
}
