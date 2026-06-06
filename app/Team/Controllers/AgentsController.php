<?php

namespace App\Team\Controllers;

use App\Conversations\Traits\BuildsConversationResources;
use App\Models\User;
use App\Team\Events\AgentUpdated;
use App\Team\Models\AgentSettings;
use Carbon\Carbon;
use Common\Auth\Actions\CreateUser;
use Common\Auth\UserSession;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AgentsController extends BaseController
{
    use BuildsConversationResources;

    public function store()
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('agents.update'));
        $this->blockOnDemoSite();

        $data = request()->validate([
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:5',
            'role_id' => 'required|int|exists:roles,id',
            'group_id' => 'required|int|exists:groups,id',
        ]);

        $agent = (new CreateUser())->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'email_verified_at' => now(),
            'roles' => [$data['role_id']],
            'type' => 'agent',
        ]);

        $agent->groups()->syncWithoutDetaching([
            $data['group_id'] => [
                'conversation_priority' => 'backup',
                'created_at' => now(),
            ],
        ]);

        // ensure defaults exist
        if (!$agent->agentSettings) {
            $agent->agentSettings()->create(AgentSettings::newFromDefault()->toArray());
        }

        $agent->load(['roles', 'groups', 'agentSettings']);

        return $this->success(['agent' => $agent]);
    }

    public function index()
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('agents.update'));

        $orderBy = request('orderBy', 'users.updated_at');
        $orderDir = request('orderDir', 'desc');
        $query = request('query', '');

        $pagination = User::query()
            ->with(['roles', 'agentSettings'])
            ->whereAgent()
            ->addSelect([
                'last_active_at' => UserSession::select('updated_at')
                    ->whereColumn('user_id', 'users.id')
                    ->orderByDesc('updated_at')
                    ->limit(1),
            ])
            ->orderBy($orderBy, $orderDir)
            ->when($query, fn($q) => $q->mysqlSearch($query))
            ->simplePaginate();

        $data = $pagination->getCollection()->map(
            fn(User $agent) => [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'role' => $agent->roles->first()?->name,
                'banned_at' => $agent->banned_at,
                'last_active_at' => $agent->last_active_at
                    ? Carbon::parse($agent->last_active_at)->toJSON()
                    : null,
                'accepts_conversations' => $agent->acceptsConversations(),
            ],
        );

        return $this->success([
            'pagination' => $this->buildSimplePagination($pagination, $data),
        ]);
    }

    public function show($agentId)
    {
        $agentId = $agentId === 'me' ? Auth::id() : $agentId;
        $agent = User::with([
            'roles',
            'groups',
            'permissions',
            'agentSettings',
            'tokens',
            'social_profiles',
        ])->findOrFail($agentId);

        Gate::allowIf(
            fn(User $user) => $user->id === $agentId ||
                $user->hasPermission('agents.update'),
        );

        if (!$agent->agentSettings) {
            $agent->setRelation(
                'agentSettings',
                AgentSettings::newFromDefault(),
            );
        }

        if (Auth::id() === $agentId) {
            $agent->load(['tokens']);
            $agent->makeVisible([
                'two_factor_confirmed_at',
                'two_factor_recovery_codes',
            ]);
            if ($agent->two_factor_confirmed_at) {
                $agent->two_factor_recovery_codes = $agent->recoveryCodes();
                $agent->syncOriginal();
            }
        }

        return $this->success(['agent' => $agent]);
    }

    public function update(int $agentId)
    {
        $agentId = $agentId === 'me' ? Auth::id() : $agentId;

        Gate::allowIf(
            fn(User $user) => $user->id === $agentId ||
                $user->hasPermission('agents.update'),
        );

        $agent = User::findOrFail($agentId);

        $data = request()->validate([
            'name' => 'string|nullable',
            'agent_settings.assignment_limit' => 'nullable|integer',
            'agent_settings.accepts_conversations' => 'nullable|string',
            'agent_settings.working_hours' => 'nullable|array',
            'groups' => 'nullable|array',
            'roles' => 'nullable|array',
        ]);

        if (isset($data['agent_settings'])) {
            $agent
                ->agentSettings()
                ->updateOrCreate(
                    ['user_id' => $agent->id],
                    $data['agent_settings'],
                );
        }

        if (isset($data['groups'])) {
            $agent->groups()->sync(
                collect($data['groups'])->mapWithKeys(
                    fn($groupId) => [
                        $groupId => ['conversation_priority' => 'backup'],
                    ],
                ),
            );
        }

        if (isset($data['roles'])) {
            $agent->roles()->sync($data['roles']);
        }

        $agent->update([
            'name' => $data['name'],
        ]);

        event(new AgentUpdated($agent));

        return $this->success(['agent' => $agent]);
    }

    public function destroy(int $agentId)
    {
        $agentId = $agentId === 'me' ? Auth::id() : $agentId;

        $agent = User::whereAgent()->findOrFail($agentId);

        Gate::allowIf(fn(User $user) => $user->hasPermission('agents.update'));
        $this->blockOnDemoSite();

        $agent->delete();

        return $this->success();
    }
}
