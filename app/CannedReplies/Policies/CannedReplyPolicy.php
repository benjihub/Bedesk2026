<?php namespace App\CannedReplies\Policies;

use App\CannedReplies\Models\CannedReply;
use App\Models\User;
use Common\Core\Policies\BasePolicy;

class CannedReplyPolicy extends BasePolicy
{
    public function index(User $user)
    {
        return $user->hasPermission('canned_replies.update');
    }

    public function show(User $user)
    {
        return $user->hasPermission('canned_replies.update');
    }

    public function store(User $user)
    {
        return $user->hasPermission('canned_replies.update');
    }

    public function update(User $user, CannedReply $reply)
    {
        return $user->hasPermission('canned_replies.update') ||
            $user->id === $reply->user_id;
    }

    public function destroy(User $user)
    {
        return $user->hasPermission('canned_replies.update');
    }
}
