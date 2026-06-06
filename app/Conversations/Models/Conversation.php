<?php namespace App\Conversations\Models;

use Ai\AiAgent\Models\AiAgentSession;
use Ai\AiAgent\Models\ConversationSummary;
use App\Attributes\Traits\HasCustomAttributes;
use App\Conversations\Events\ConversationsUpdated;
use App\Models\User;
use App\Team\Models\Group;
use Common\Core\BaseModel;
use Common\Tags\Taggable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Laravel\Scout\Searchable;

class Conversation extends BaseModel
{
    use Searchable, Taggable, HasCustomAttributes;

    const MODEL_TYPE = 'conversation';

    const ATTACHMENT_UPLOAD_TYPE = 'conversationAttachments';
    const IMAGE_UPLOAD_TYPE = 'conversationImages';

    const STATUS_OPEN = 6;
    const STATUS_PENDING = 5;
    const STATUS_CLOSED = 4;
    const STATUS_LOCKED = 3;

    const ASSIGNED_AGENT = 'agent';
    const ASSIGNED_BOT = 'bot';

    const MODE_NORMAL = 'normal';
    const MODE_PREVIEW = 'preview';

    const AUTHOR_USER = 'user';
    const AUTHOR_AGENT = 'agent';
    const AUTHOR_BOT = 'bot';
    const AUTHOR_SYSTEM = 'system';

    protected $guarded = ['id'];
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'assignee_id' => 'integer',
        'group_id' => 'integer',
        'closed_at' => 'datetime',
        'assigned_at' => 'datetime',
        'rating' => 'boolean',
    ];
    protected $appends = ['model_type'];

    public function isNormalMode()
    {
        return $this->mode === self::MODE_NORMAL;
    }

    public function items(): HasMany
    {
        return $this->hasMany(ConversationItem::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationItem::class)->where(
            'type',
            'message',
        );
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(ConversationItem::class)
            ->orderBy('id', 'desc')
            ->where('type', 'message')
            ->limit(1);
    }

    public function latestAgentMessage(): HasOne
    {
        return $this->latestMessage()->where('author', self::AUTHOR_AGENT);
    }

    public function latestMessages(int $limit = 5): HasMany
    {
        return $this->messages()->orderBy('id', 'desc')->limit($limit);
    }

    public function agentMessages(): HasMany
    {
        return $this->messages()->where('author', self::AUTHOR_AGENT);
    }

    public function latestEvent(): HasOne
    {
        return $this->hasOne(ConversationItem::class)
            ->orderBy('id', 'desc')
            ->where('type', 'event')
            ->limit(1);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function ticketEventLogs(): HasMany
    {
        return $this->hasMany(TicketEventLog::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(ConversationStatus::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function summary(): HasOne
    {
        return $this->hasOne(ConversationSummary::class);
    }

    public function aiAgentSession(): HasOne
    {
        return $this->hasOne(AiAgentSession::class);
    }

    #[Scope]
    protected function whereNotClosed(Builder $builder): void
    {
        $builder->where('status_category', '>', self::STATUS_CLOSED);
    }

    #[Scope]
    protected function whereAssignedToHuman(Builder $builder): Builder
    {
        return $builder->where('assigned_to', self::ASSIGNED_AGENT);
    }

    #[Scope]
    protected function whereGroup(
        Builder $builder,
        int|array $groupIds,
    ): Builder {
        return $builder->whereIn('group_id', Arr::wrap($groupIds));
    }

    #[Scope]
    protected function whereCountry(
        Builder $builder,
        string $country,
        string $operator = '=',
        string $boolean = 'and',
    ): Builder {
        return $builder->has('user', '>=', 1, $boolean, function (
            Builder $q,
        ) use ($country, $operator) {
            $q->where('country', $operator, $country);
        });
    }

    public static function changeStatus(
        ConversationStatus $status,
        iterable $conversations,
    ): iterable {
        if (!($conversations[0] instanceof self)) {
            $conversations = static::whereIn('id', $conversations)->get();
        }
        $conversations = collect($conversations);

        $updatedEvent = new ConversationsUpdated($conversations);

        $values = [
            'status_id' => $status->id,
            'status_category' => $status->category,
        ];
        if ($status->category <= Conversation::STATUS_CLOSED) {
            $values['closed_at'] = now();
            $user = Auth::user();
            if ($user?->isAgent()) {
                $values['closed_by'] = $user->id;
            }
        } elseif ($status->category > Conversation::STATUS_CLOSED) {
            $values['closed_at'] = null;
            $values['closed_by'] = null;
        }

        // If a conversation is currently in an active human support handoff,
        // do not allow background automation to close it. Agent-initiated
        // closes are allowed so handled support tickets can leave the queue.
        $conversationsToUpdate = $conversations->filter(function ($conversation) use ($status) {
            try {
                if (
                    $status->category <= Conversation::STATUS_CLOSED &&
                    !Auth::user()?->isAgent()
                ) {
                    $session = $conversation->aiAgentSession()->first();
                    $context = is_array($session?->context ?? null) ? $session->context : [];
                    if (!empty($context['support_handoff_active'])) {
                        // skip closing this conversation while handoff is active
                        \Illuminate\Support\Facades\Log::info('Skipping auto-close due to active support handoff', [
                            'conversation_id' => $conversation->id,
                            'status_id' => $status->id,
                            'support_handoff_context' => $context,
                        ]);
                        return false;
                    }
                }
            } catch (\Throwable $_) {
                // best-effort: if session can't be read, allow update
            }

            return true;
        });

        if ($conversationsToUpdate->isEmpty()) {
            // nothing to update (e.g., all conversations are in handoff), return original collection
            return $conversations;
        }

        $conversationsToUpdate = $conversationsToUpdate->map(function ($conversation) use (
            $values,
            $status,
        ) {
            $conversation->fill($values);
            $conversation->setRelation('status', $status);
            return $conversation;
        });

        static::whereIn('id', $conversationsToUpdate->pluck('id'))->update($values);

        $updatedEvent->dispatch($conversationsToUpdate);

        // merge updated and skipped conversations and return full set
        return $conversations->map(function ($original) use ($conversationsToUpdate) {
            $updated = $conversationsToUpdate->firstWhere('id', $original->id);
            return $updated ?? $original;
        });
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->subject,
        ];
    }

    public function toSearchableArray(): array
    {
        $attributes = [];

        if (
            $this->relationLoaded('customAttributes') &&
            !$this->customAttributes->isEmpty()
        ) {
            $attributes = $this->customAttributes->mapWithKeys(
                fn($attribute) => ["ca_$attribute->key" => $attribute->value],
            );
        }

        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'type' => $this->type,
            'messages' => $this->messages
                ->filter(
                    fn(ConversationItem $message) => $message->type ===
                        'message',
                )
                ->map(
                    fn(
                        ConversationItem $message,
                    ) => $message->toSearchableArray(),
                )
                ->slice(0, 50),
            'tags' => $this->tags->pluck('id'),
            'user' => $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ]
                : null,
            'user_id' => $this->user ? $this->user->id : null,
            'group' => $this->group ? $this->group->toSearchableArray() : null,
            'group_id' => $this->group ? $this->group->id : null,
            'country' => $this->user?->country,
            'status_category' => $this->status_category,
            'status_id' => $this->status?->id,
            'assignee_id' => $this->assignee_id,
            'closed_at' => $this->closed_at->timestamp ?? '_null',
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
            ...$attributes,
        ];
    }

    public function makeSearchableUsing(Collection $models)
    {
        return $models->load([
            'user',
            'group',
            'tags',
            'status',
            'customAttributes' => fn(BelongsToMany $builder) => $builder->where(
                'type',
                'conversation',
            ),
            'messages' => fn(HasMany $builder) => $builder->where(
                'type',
                'message',
            ),
        ]);
    }

    protected function makeAllSearchableUsing($query)
    {
        return $query->with([
            'user',
            'tags',
            'group',
            'status',
            'customAttributes' => fn(BelongsToMany $builder) => $builder->where(
                'type',
                'conversation',
            ),
            'messages' => fn(HasMany $builder) => $builder->where(
                'type',
                'message',
            ),
        ]);
    }

    public static function filterableFields(): array
    {
        return [
            'id',
            'status_id',
            'type',
            'created_at',
            'updated_at',
            'closed_at',
            'tags',
            'assignee_id',
            'group_id',
            'status_category',
            'user_id',
            'country',
            // all custom attributes
            'ca_*',
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
