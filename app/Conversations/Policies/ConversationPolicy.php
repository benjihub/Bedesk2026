<?php namespace App\Conversations\Policies;

use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Core\Policies\BasePolicy;

class ConversationPolicy extends BasePolicy
{
    public function index(User $user, $userId = null)
    {
        return $this->hasVariablePermission($user, 'update') ||
            $user->id === (int) $userId;
    }

    public function show(User $user, Conversation $conversation)
    {
        return $user->id === $conversation->user_id ||
            $this->canAccessAssignedConversation($user, $conversation);
    }

    public function store(?User $user)
    {
        if (!$user?->email && settings('tickets.guest_tickets')) {
            return true;
        }

        return $this->hasVariablePermission($user, 'create') ||
            $this->hasVariablePermission($user, 'update');
    }

    public function update(User $user, ?Conversation $conversation = null)
    {
        if (!$this->hasVariablePermission($user, 'update')) {
            return false;
        }

        // If no specific conversation is provided (e.g. for listing, creating),
        // only check generic permission.
        if (!$conversation) {
            return true;
        }

        return $this->canAccessAssignedConversation($user, $conversation);
    }

    public function destroy(User $user)
    {
        return $this->hasVariablePermission($user, 'update');
    }

    public function reply(User $user, Conversation $conversation)
    {
        return $user->id === $conversation->user_id ||
            $this->update($user, $conversation);
    }

    protected function hasVariablePermission(User $user, string $action): bool
    {
        return $this->hasPermission($user, "tickets.$action") ||
            $this->hasPermission($user, "conversations.$action");
    }

    protected function canAccessAssignedConversation(
        User $user,
        Conversation $conversation,
    ): bool {
        if (!$this->hasVariablePermission($user, 'update')) {
            return false;
        }

        if ($user->hasPermission('admin')) {
            return true;
        }

        if (!$conversation->group_id) {
            return false;
        }

        return $user->groups()->whereKey($conversation->group_id)->exists();
    }
}
