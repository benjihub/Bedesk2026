<?php

namespace App\Conversations\Models;

use App\Models\User;
use App\Team\Models\Group;
use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationView extends BaseModel
{
    const MODEL_TYPE = 'conversationView';

    public const VIEW_ACCESS_ANYONE = 'anyone';
    public const VIEW_ACCESS_OWNER = 'owner';
    public const VIEW_ACCESS_GROUP = 'group';

    protected $guarded = [];

    protected $casts = [
        'conditions' => 'array',
        'columns' => 'array',
        'group_id' => 'integer',
        'owner_id' => 'integer',
        'pinned' => 'boolean',
        'active' => 'boolean',
        'internal' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id')->compact();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id')->select('id', 'name');
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at', 'owner_id', 'group_id'];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
        ];
    }
}
