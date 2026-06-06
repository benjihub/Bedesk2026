<?php

namespace Common\Auth\Actions;

use App\Models\User;
use Common\Auth\Permissions\Traits\SyncsPermissions;
use Common\Files\FileEntry;
use Illuminate\Support\Arr;

class UpdateUser
{
    use SyncsPermissions;

    public function execute(User $user, array $params): User
    {
        if (array_key_exists('image_entry_id', $params)) {
            $entry = $params['image_entry_id']
                ? FileEntry::find($params['image_entry_id'])
                : null;
            unset($params['image_entry_id']);

            // remove image if "image_entry_id" is null
            $user->image = $entry?->url;
            if ($entry) {
                $user->avatars()->sync([$entry->id]);
            } else {
                $user->avatars()->detach();
            }
        }

        $user->fill(Arr::except($params, ['roles', 'permissions']))->save();

        // make sure roles and permission are not removed
        // if they are not specified at all in params
        if (array_key_exists('roles', $params)) {
            $user->roles()->sync($params['roles']);
        }
        if (array_key_exists('permissions', $params)) {
            $this->syncPermissions($user, Arr::get($params, 'permissions'));
        }

        return $user->load(['roles', 'permissions']);
    }
}
