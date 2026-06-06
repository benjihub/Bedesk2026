<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Conversations\Traits\BuildsConversationResources;
use App\Team\Models\AgentInvite;
use App\Team\Notifications\AgentInvitation;
use Common\Core\BaseController;
use Common\Core\Controllers\HomeController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class AgentInvitesController extends BaseController
{
    use BuildsConversationResources;

    public function index()
    {
        $this->authorize('index', Conversation::class);

        $orderBy = request('orderBy', 'updated_at');
        $orderDir = request('orderDir', 'desc');
        $query = request('query', '');

        $pagination = AgentInvite::with(['role', 'group'])
            ->orderBy($orderBy, $orderDir)
            ->when($query, fn($q) => $q->where('email', 'like', "%{$query}%"))
            ->simplePaginate();

        $data = $pagination->getCollection()->map(
            fn(AgentInvite $invite) => [
                'id' => $invite->id,
                'email' => $invite->email,
                'role' => $invite->role?->name,
                'group' => $invite->group?->name,
                'created_at' => $invite->created_at,
                'updated_at' => $invite->updated_at,
            ],
        );

        return $this->success([
            'pagination' => $this->buildSimplePagination($pagination, $data),
        ]);
    }

    public function show(string $id)
    {
        $invite = AgentInvite::findOrFail($id);
        $user = Auth::user();

        if ($user) {
            $invite->makeExistingUserAgent($user);

            return redirect('dashboard');
        }

        return app(HomeController::class)->show();
    }

    public function store()
    {
        $this->authorize('store', Conversation::class);

        $data = request()->validate(
            [
                'emails' => 'required|array',
                'emails.*' => 'required|email|unique:agent_invites,email',
                'role_id' => 'required|int',
                'group_id' => 'required|int',
            ],
            [
                'emails.*.unique' => __(
                    'The email :input has already been invited.',
                ),
            ],
        );

        AgentInvite::insert(
            collect($data['emails'])
                ->map(
                    fn($email) => [
                        'id' => Str::orderedUuid(),
                        'email' => $email,
                        'role_id' => $data['role_id'],
                        'group_id' => $data['group_id'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                )
                ->toArray(),
        );

        AgentInvite::whereIn('email', $data['emails'])
            ->get()
            ->each(
                fn(AgentInvite $invite) => Notification::route(
                    'mail',
                    $invite->email,
                )->notifyNow(new AgentInvitation(Auth::user()->name, $invite)),
            );

        return $this->success();
    }

    public function resend(string $inviteId)
    {
        $this->authorize('store', Conversation::class);

        $invite = AgentInvite::findOrFail($inviteId);

        $notification = new AgentInvitation(Auth::user()->name, $invite);

        Notification::route('mail', $invite->email)->notifyNow($notification);
        $invite->touch();

        return $this->success();
    }

    public function destroy(string $inviteId)
    {
        $this->authorize('store', Conversation::class);

        $invite = AgentInvite::findOrFail($inviteId);

        $invite->delete();

        return $this->success();
    }
}
