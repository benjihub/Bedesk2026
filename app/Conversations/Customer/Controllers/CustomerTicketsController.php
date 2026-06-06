<?php namespace App\Conversations\Customer\Controllers;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Actions\ConversationEventsCreator;
use App\Conversations\Actions\ConversationListBuilder;
use App\Conversations\Customer\Actions\CreateTicketAsCustomer;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use Common\Auth\Actions\CreateUser;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Common\Validation\CaptchaTokenValid;
use Envato\Rules\EnvatoSupportIsNotExpired;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CustomerTicketsController extends BaseController
{
    public function index()
    {
        $this->middleware('auth:sanctum');

        $builder = Conversation::query()
            ->where('user_id', Auth::id())
            ->where('assigned_to', 'agent')
            ->where('type', 'ticket')
            ->when(
                request('statusId'),
                fn($query) => $query->where('status_id', request('statusId')),
            );

        $datasource = new Datasource(
            $builder,
            request()->only(['orderBy', 'orderDir', 'query', 'page']),
        );

        if (!request('orderBy')) {
            $closed = Conversation::STATUS_CLOSED;
            $datasource->order = false;
            $builder
                ->orderByRaw(
                    "CASE WHEN status_category > $closed THEN 0 ELSE 1 END",
                )
                ->orderBy('updated_at', 'desc')
                ->orderBy('id', 'desc');
        }

        $pagination = $datasource->paginate();

        return $this->success([
            'pagination' => (new ConversationListBuilder())->simplePagination(
                $pagination,
            ),
        ]);
    }

    public function show($id)
    {
        $this->middleware('auth:sanctum');

        $conversation = Conversation::where('user_id', Auth::id())->findOrFail(
            $id,
        );

        $attributes = $conversation
            ->customAttributes()
            ->where('materialized', false)
            ->where(
                'permission',
                '!=',
                CustomAttribute::PERMISSION_AGENT_CAN_EDIT,
            )
            ->get()
            ->map(
                fn(CustomAttribute $attribute) => $attribute->toCompactArray(
                    'customer',
                ),
            );

        $data = [
            'id' => $conversation->id,
            'subject' => $conversation->subject,
            'status' =>
                $conversation->status->user_label ??
                $conversation->status->label,
            'updated_at' => $conversation->updated_at,
            'created_at' => $conversation->created_at,
            'status_category' => $conversation->status_category,
            'priority' => $conversation->priority,
            'user' => $conversation->user
                ? [
                    'id' => $conversation->user->id,
                    'name' => $conversation->user->name,
                    'image' => $conversation->user->image,
                ]
                : null,
            'assignee' => $conversation->assignee
                ? [
                    'id' => $conversation->assignee->id,
                    'name' => $conversation->assignee->name,
                    'image' => $conversation->assignee->image,
                ]
                : null,
        ];

        return $this->success([
            'conversation' => $data,
            'attributes' => $attributes,
        ]);
    }

    public function store()
    {
        $this->authorize('store', Conversation::class);

        $data = $this->validate(
            request(),
            [
                'email' => Auth::check()
                    ? 'nullable'
                    : 'email|unique:users,email|required',
                'subject' => 'required|min:3|max:180',
                'message.body' => 'required|string|min:3',
                'message.attachments' => 'array|max:10',
                'captcha_token' => [new CaptchaTokenValid('new_ticket')],
                'attributes' => 'array',
                'attributes.category' => [new EnvatoSupportIsNotExpired()],
            ],
            [
                'email' => __(
                    'An account with this email already exists. Please log in to continue.',
                ),
            ],
            [
                'message.body' => 'description',
            ],
        );
        $data['channel'] = 'website';

        $user = Auth::check()
            ? Auth::user()
            : User::findBySecondaryEmail($data['email']) ??
                (new CreateUser())->execute([
                    'secondary_email' => $data['email'],
                ]);

        $conversation = (new CreateTicketAsCustomer())->execute($data, $user);

        return response()->json(['conversation' => $conversation]);
    }

    public function markConversationAsSolved(int $id)
    {
        // allow both sanctum auth and widget header based auth (for cross-site iframe)
        // Note: CSRF is disabled for this route so header-based auth is required for security.
        // Attempt header-based widget auth if sanctuary auth not present.
        if (!Auth::check()) {
            $token = request()->header('X-Widget-Auth');
            if (is_string($token) && str_contains($token, '.')) {
                [$userId, $sig] = explode('.', $token, 2);
                $userId = (int) $userId;
                $secret = config('app.widget_hmac_secret') ?: config('app.key');
                if ($userId > 0 && is_string($secret)) {
                    $expected = hash_hmac('sha256', (string) $userId, $secret);
                    if (hash_equals($expected, (string) $sig)) {
                        if ($user = User::find($userId)) {
                            // set the current user for this request
                            auth('chatWidget')->setUser($user);
                            // also set default Auth guard so Auth::id() works
                            auth()->setUser($user);
                        }
                    }
                }
            }
        }

        $conversation = Conversation::where('user_id', Auth::id())->findOrFail(
            $id,
        );

        $status = ConversationStatus::getDefaultClosed();

        Conversation::changeStatus($status, [$conversation]);

        (new ConversationEventsCreator($conversation))->closedByCustomer(
            Auth::user(),
        );

        return $this->success();
    }
}
