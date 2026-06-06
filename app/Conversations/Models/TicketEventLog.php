<?php

namespace App\Conversations\Models;

use App\Models\User;
use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketEventLog extends BaseModel
{
    public const MODEL_TYPE = 'ticketEventLog';
    public const EVENT_CREATED = 'ticket.created';
    public const EVENT_ASSIGNED = 'ticket.assigned';
    public const EVENT_FIRST_REPLY = 'ticket.first_reply';
    public const EVENT_NEED_HUMAN_SUPPORT = 'ticket.need_human_support';
    public const EVENT_CLOSED = 'ticket.closed';
    public const EVENT_REOPENED = 'ticket.reopened';

    protected $guarded = ['id'];

    protected $casts = [
        'conversation_id' => 'integer',
        'actor_id' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function filterableFields(): array
    {
        return ['id', 'conversation_id', 'event_type', 'actor_type', 'actor_id'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->event_type,
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'event_type' => $this->event_type,
            'actor_type' => $this->actor_type,
            'actor_id' => $this->actor_id,
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
