<?php namespace App\Conversations\Agent\Controllers;

use App\Conversations\Agent\Actions\ConversationListLoader;
use App\Conversations\Agent\Actions\CreateConversationAsAgent;
use App\Conversations\Agent\Actions\DeleteMultipleConversations;
use App\Conversations\Agent\Actions\FullConversationLoader;
use App\Conversations\Agent\Actions\SendTicketReplyEmail;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class AgentConversationsController extends BaseController
{
    public function index()
    {
        $this->authorize('index', Conversation::class);

        $response = (new ConversationListLoader())->load(request()->all());

        return $this->success($response);
    }

    public function show(int $id)
    {
        $conversation = Conversation::findOrFail($id);

        try {
            $this->authorize('show', $conversation);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            \Illuminate\Support\Facades\Log::warning('Conversation show authorization failed', [
                'conversation_id' => $conversation->id,
                'conversation_user_id' => $conversation->user_id,
                'requesting_user_id' => auth()->id(),
                'request_ip' => getIp(),
                'route' => optional(request()->route())?->getName(),
            ]);
            throw $e;
        }

        // If client requests a fast lightweight payload, return minimal data
        if ((bool) request()->query('fast')) {
            $conversation->loadMissing(['user.latestUserSession', 'tags']);

            $user = $conversation->user
                ? [
                    'id' => $conversation->user->id,
                    'name' => $conversation->user->name ?? null,
                    'email' => $conversation->user->email ?? null,
                    'country' => $conversation->user->country ?? null,
                    'city' => null,
                    'timezone' => $conversation->user->timezone ?? null,
                    'tags' => $conversation->user->tags?->pluck('name')->toArray() ?? [],
                    'banned_at' => $conversation->user->banned_at ?? null,
                    'bans' => [],
                ]
                : null;

            $tags = $conversation->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name])->toArray();

            // Expose IP in the fast path so the sidebar can display it
            // immediately without waiting for the full conversation load.
            // Prefer the user's latest session IP; fall back to the IP
            // captured directly on the conversation at creation time.
            $fastSession = $conversation->user?->latestUserSession;
            $fastIp = ($fastSession?->ip_address ?: null) ?: ($conversation->request_ip ?: null);

            $minimal = [
                'conversation' => array_merge($conversation->only([
                    'id',
                    'model_type',
                    'subject',
                    'type',
                    'status_id',
                    'status_category',
                    'assignee',
                    'group',
                    'rating',
                    'created_at',
                    'updated_at',
                    'channel',
                    'assigned_to',
                ]), [
                    'ai_handoff_active' => (bool) ($conversation->aiAgentSession?->context['support_handoff_active'] ?? false),
                ]),
                'user' => $user,
                'visits' => ['pageParams' => [], 'pages' => []],
                'summary' => null,
                'session' => $fastIp ? [
                    'id' => $fastSession?->id ?? null,
                    'ip_address' => $fastIp,
                    'platform' => $fastSession?->platform ?? null,
                    'browser' => $fastSession?->browser ?? null,
                    'device' => $fastSession?->device ?? null,
                ] : null,
                'attributes' => [],
                'envatoPurchaseCodes' => [],
                'tags' => $tags,
            ];

            return $this->success($minimal);
        }

        $response = (new FullConversationLoader())->loadData($conversation);

        return $this->success($response);
    }

    public function store()
    {
        $this->authorize('store', Conversation::class);

        $data = $this->validate(
            request(),
            [
                'type' => 'required|in:ticket,chat',
                'user_id' => 'required|integer|exists:users,id',
                'subject' => 'required_if:type,ticket|nullable|min:3|max:180',
                'message.body' => 'required|string|min:3',
                'message.attachments' => 'array|max:10',
                'status_id' => 'int|exists:conversation_statuses,id',
                'attributes' => 'array',
            ],
            [],
            [
                'message.body' => 'message',
                'user_id' => 'customer',
            ],
        );

        $conversation = (new CreateConversationAsAgent())->execute($data);

        if ($conversation->type === 'ticket' && $conversation->latestMessage) {
            (new SendTicketReplyEmail())->execute(
                $conversation,
                $conversation->latestMessage,
                Auth::user(),
            );
        }

        return response()->json(['conversation' => $conversation]);
    }

    public function update(int $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->authorize('update', $conversation);

        $updatedEvent = new ConversationsUpdated([$conversation]);

        $data = $this->validate(request(), [
            'subject' => 'min:3|max:255',
            'user_id' => 'integer|exists:users,id',
            'attributes' => 'array',
        ]);

        if (isset($data['attributes'])) {
            $conversation->updateCustomAttributes($data['attributes']);
        }

        $conversation->fill($data)->save();

        $updatedEvent->dispatch([$conversation]);

        return $this->success(['conversation' => $conversation]);
    }

    public function destroy(string $ids)
    {
        $conversationIds = explode(',', $ids);

        $this->blockOnDemoSite();

        Conversation::whereIn('id', $conversationIds)
            ->get()
            ->each(fn(Conversation $conversation) => $this->authorize('update', $conversation));

        (new DeleteMultipleConversations())->execute($conversationIds);

        return $this->success([], 204);
    }
}
