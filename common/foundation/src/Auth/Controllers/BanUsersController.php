<?php

namespace Common\Auth\Controllers;

use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class BanUsersController extends BaseController
{
    public function store(string $userIds)
    {
        $data = $this->validate(request(), [
            'ban_until' => 'nullable|date|after:now',
            'comment' => 'nullable|string|max:255',
            'permanent' => 'boolean',
        ]);

        $userIds = explode(',', $userIds);

        $this->authorize('destroy', [User::class, $userIds]);
        $this->blockOnDemoSite();

        $users = User::with('roles')->whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            if ($user->hasPermission('admin')) {
                abort(403, 'Admin users can\'t be suspended');
            }

            if ($user->id === Auth::id()) {
                abort(403, 'You can\'t suspend yourself');
            }

            $user->createBan($data);
        }

        return $this->success();
    }

    public function destroy(string $userIds)
    {
        $userIds = explode(',', $userIds);

        $this->authorize('destroy', [User::class, $userIds]);
        $this->blockOnDemoSite();

        $users = User::with('roles')->whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            $user->unban();
        }

        return $this->success();
    }
}
