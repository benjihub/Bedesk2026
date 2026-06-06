<?php namespace Common\Auth\Roles;

use App\Models\User;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;

class RolesController extends BaseController
{
    public function __construct(protected Role $role, protected User $user) {}

    public function index()
    {
        $this->authorize('index', Role::class);

        $pagination = (new Datasource(
            Role::query()->where('type', request('type', 'users')),
            request()->all(),
        ))->paginate();

        return $this->success(['pagination' => $pagination]);
    }

    public function show(Role $role)
    {
        $this->authorize('show', Role::class);

        $role->load(['permissions']);

        return $this->success(['role' => $role]);
    }

    public function store()
    {
        $this->authorize('store', Role::class);
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'name' => 'required|unique:roles|min:2|max:255',
            'description' => 'nullable|string|max:200',
            'type' => 'string',
            'permissions' => 'nullable|array',
        ]);

        $role = (new CrupdateRole())->execute($data);

        return $this->success(['role' => $role], 201);
    }

    public function update(int $id)
    {
        $this->authorize('update', Role::class);
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'name' => "min:2|max:255|unique:roles,name,$id",
            'description' => 'nullable|string|max:200',
            'type' => 'string',
            'permissions' => 'array',
        ]);

        $role = Role::findOrFail($id);

        $role = (new CrupdateRole())->execute($data, $role);

        return $this->success(['role' => $role]);
    }

    public function destroy(int $id)
    {
        $role = Role::findOrFail($id);

        if ($role->internal) {
            return $this->error(
                __("System role ':name' cannot be deleted.", [
                    'name' => $role->name,
                ]),
            );
        }

        $this->authorize('destroy', $role);
        $this->blockOnDemoSite();

        $role->users()->detach();
        $role->delete();

        return $this->success([], 204);
    }

    public function addUsers(int $roleId)
    {
        $this->authorize('update', Role::class);

        $this->validate(request(), [
            'userIds' => 'required|array|min:1|max:25',
            'userIds.*' => 'required|int',
        ]);

        $role = $this->role->findOrFail($roleId);
        $this->blockOnDemoSite();

        $users = $this->user
            ->with('roles')
            ->whereIn('id', request('userIds'))
            ->get(['email', 'id']);

        if ($users->isEmpty()) {
            return $this->error(
                __('Could not attach specified users to role.'),
            );
        }

        //filter out users that are already attached to this role
        $users = $users->filter(function ($user) use ($roleId) {
            return !$user->roles->contains('id', $roleId);
        });

        $role->users()->attach($users->pluck('id')->toArray());

        return $this->success(['users' => $users]);
    }

    public function removeUsers(int $roleId)
    {
        $this->authorize('update', Role::class);
        $this->blockOnDemoSite();

        $this->validate(request(), [
            'userIds' => 'required|array|min:1',
            'userIds.*' => 'required|integer',
        ]);

        $role = $this->role->findOrFail($roleId);

        $role->users()->detach(request('userIds'));

        return $this->success();
    }
}
