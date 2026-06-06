<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Models\Conversation;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\Models\User;
use App\Team\Models\Group;
use Common\Auth\Roles\Role;
use Common\Core\BaseController;
use Common\Tags\Tag;
use Envato\Models\EnvatoItem;

class HelpDeskAutocompleteController extends BaseController
{
    public function agents()
    {
        $this->authorize('index', Conversation::class);

        $agents = User::query()
            ->with(['roles', 'permissions'])
            ->whereAgent()
            ->limit(40)
            ->get()
            ->map(fn(User $user) => $user->toCompactAgentArray());

        return $this->success(['agents' => $agents]);
    }

    public function customers()
    {
        $this->authorize('index', Conversation::class);

        $customers = User::query()
            ->where('type', 'user')
            ->whereNotNull('email')
            ->when(request('query'), function ($query) {
                $query
                    ->where('name', 'like', '%' . request('query') . '%')
                    ->orWhere('email', 'like', '%' . request('query') . '%');
            })
            ->limit(40)
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name ?? 'Visitor',
                    'description' => $user->email,
                    'image' => $user->image,
                ];
            });

        return $this->success(['models' => $customers]);
    }

    public function customer($id)
    {
        $this->authorize('index', Conversation::class);

        $customer = User::findOrFail($id);

        return $this->success(['model' => $customer->toNormalizedArray()]);
    }

    public function roles()
    {
        $this->authorize('index', Conversation::class);

        $roles = Role::query()
            ->limit(40)
            ->when(
                request('type') === 'agents',
                fn($q) => $q->whereHas(
                    'permissions',
                    fn($q) => $q->whereIn('name', ['conversations.update']),
                ),
            )
            ->get();

        $defaultRoleId = $roles
            ->when(
                request('type'),
                fn($q) => $q->where('type', request('type')),
            )
            ->first()?->id;

        return $this->success([
            'roles' => $roles->map(
                fn(Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ],
            ),
            'defaultRoleId' => $defaultRoleId,
        ]);
    }

    public function groups()
    {
        // this will need to be usable by guests, so no authorization

        $groups = Group::limit(40)->get(['id', 'name', 'default']);

        return $this->success([
            'groups' => $groups,
            'defaultGroupId' => $groups->first(fn(Group $g) => $g->default)
                ?->id,
        ]);
    }

    public function hcCategories()
    {
        $this->authorize('update', HcArticle::class);

        $categories = HcCategory::limit(40)
            ->whereNull('parent_id')
            ->with('sections')
            ->get()
            ->map(
                fn(HcCategory $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'image' => $category->image,
                    'sections' => $category->sections->map(
                        fn(HcCategory $section) => [
                            'id' => $section->id,
                            'name' => $section->name,
                            'parent_id' => $section->parent_id,
                        ],
                    ),
                ],
            );

        return $this->success([
            'categories' => $categories,
        ]);
    }

    public function tags()
    {
        $this->authorize('index', Conversation::class);

        $tags = Tag::when(
            request('query'),
            fn($q) => $q->mysqlSearch(request('query')),
        )
            ->limit(40)
            ->get(['id', 'name', 'display_name'])
            ->map(
                fn(Tag $tag) => [
                    'id' => $tag->id,
                    'name' => $tag->display_name ?? $tag->name,
                ],
            );

        return $this->success(['tags' => $tags]);
    }

    public function envatoItems()
    {
        $this->authorize('index', Conversation::class);

        $items = EnvatoItem::limit(40)
            ->get()
            ->map(fn(EnvatoItem $item) => $item->toNormalizedArray());

        return $this->success([
            'items' => $items,
        ]);
    }
}
