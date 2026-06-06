<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Conversations\Traits\BuildsConversationResources;
use App\Models\User;
use App\Team\Models\Group;
use Common\Core\BaseController;

class GroupsController extends BaseController
{
    use BuildsConversationResources;

    public function index()
    {
        $this->authorize('index', Conversation::class);

        $orderBy = request('orderBy', 'groups.updated_at');
        $orderDir = request('orderDir', 'desc');
        $query = request('query', '');

        $pagination = Group::query()
            ->with('users')
            ->orderBy($orderBy, $orderDir)
            ->when($query, fn($q) => $q->mysqlSearch($query))
            ->simplePaginate();

        $data = $pagination->getCollection()->map(
            fn(Group $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'default' => $group->default,
                'users' => $group->users->map(
                    fn(User $user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'image' => $user->image,
                    ],
                ),
            ],
        );

        return $this->success([
            'pagination' => $this->buildSimplePagination($pagination, $data),
        ]);
    }

    public function show(int $groupId)
    {
        $this->authorize('index', Conversation::class);

        $group = Group::with(['users.roles'])->findOrFail($groupId);

        $response = [
            'id' => $group->id,
            'name' => $group->name,
            'default' => $group->default,
            'assignment_mode' => $group->assignment_mode,
            'users' => $group->users->map(
                fn(User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image,
                    'conversation_priority' =>
                        $user->pivot->conversation_priority,
                    'role' => $user->roles->first()
                        ? [
                            'id' => $user->roles->first()->id,
                            'name' => $user->roles->first()->name,
                        ]
                        : null,
                ],
            ),
        ];

        return $this->success(['group' => $response]);
    }

    public function store()
    {
        $this->authorize('store', Conversation::class);

        $data = request()->validate(
            [
                'name' => 'required|string',
                'users' => 'required|array',
                'users.*' => 'required|array',
                'assignment_mode' => 'required|string',
            ],
            ['users' => __('At least one member is required.')],
        );

        $group = Group::create($data);

        $group->users()->attach(
            collect($data['users'])->mapWithKeys(
                fn($user) => [
                    $user['id'] => [
                        'conversation_priority' =>
                            $user['conversation_priority'] ?? 'backup',
                    ],
                ],
            ),
        );

        return $this->success(['group' => $group]);
    }

    public function update(int $groupId)
    {
        $this->authorize('store', Conversation::class);

        $group = Group::findOrFail($groupId);

        $data = request()->validate(
            [
                'name' => 'string',
                'users' => 'required|array',
                'users.*' => 'required|array',
                'assignment_mode' => 'string',
            ],
            ['users' => __('At least one member is required.')],
        );

        $group->update([
            'name' => $data['name'] ?? $group->name,
            'assignment_mode' =>
                $data['assignment_mode'] ?? $group->assignment_mode,
        ]);

        if (isset($data['users'])) {
            $userData = collect($data['users'])->mapWithKeys(
                fn($user) => [
                    $user['id'] => [
                        'conversation_priority' =>
                            $user['conversation_priority'],
                    ],
                ],
            );
            $group->users()->sync($userData);
        }

        return $this->success(['group' => $group]);
    }

    public function destroy(int $groupId)
    {
        $this->authorize('store', Conversation::class);
        $this->blockOnDemoSite();

        $group = Group::findOrFail($groupId);

        if ($group->default) {
            return $this->error(__('Default group cannot be deleted.'));
        }

        $group->users()->detach();

        $group->delete();

        return $this->success();
    }
}
