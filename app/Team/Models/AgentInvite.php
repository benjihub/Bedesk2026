<?php

namespace App\Team\Models;

use App\Models\User;
use Common\Auth\Actions\CreateUser;
use Common\Auth\Roles\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentInvite extends Model
{
    public const MODEL_TYPE = 'agentInvite';

    protected $guarded = ['id'];

    protected $keyType = 'orderedUuid';
    public $incrementing = false;

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function createUser(array $data): User
    {
        $data['email'] = $this->email;
        $data['email_verified_at'] = now();
        $data['roles'] = [$this->role_id];
        $data['type'] = 'agent';

        $user = (new CreateUser())->execute($data);

        $user->groups()->syncWithoutDetaching([
            $this->group_id => [
                'conversation_priority' => 'backup',
                'created_at' => now(),
            ],
        ]);

        $this->delete();

        return $user;
    }

    public function makeExistingUserAgent(User $user): User
    {
        if (!$user->isAgent()) {
            if ($user->type !== 'admin') {
                $user->update(['type' => 'agent']);
            }

            $user->roles()->syncWithoutDetaching([$this->role_id]);

            $user->groups()->syncWithoutDetaching([
                $this->group_id => [
                    'conversation_priority' => 'backup',
                    'created_at' => now(),
                ],
            ]);
        }

        $this->delete();

        return $user;
    }
}
