<?php

namespace App\Conversations\Models;

use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Model;

class ConversationStatus extends BaseModel
{
    const MODEL_TYPE = 'conversationStatus';

    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
        'category' => 'int',
    ];

    public static function getDefaultOpen()
    {
        return self::query()
            ->where('active', true)
            ->where('category', Conversation::STATUS_OPEN)
            ->orderBy('id', 'asc')
            ->first();
    }

    public static function getDefaultClosed()
    {
        return self::query()
            ->where('active', true)
            ->where('category', Conversation::STATUS_CLOSED)
            ->orderBy('id', 'asc')
            ->first();
    }

    public static function getDefaultPending()
    {
        return self::query()
            ->where('active', true)
            ->where('category', Conversation::STATUS_PENDING)
            ->orderBy('id', 'asc')
            ->first();
    }

    public static function findOrGetDefaultOpen(int|null $id): self
    {
        $status = $id ? self::find($id) : null;
        return $status ?? self::getDefaultOpen();
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'user_label' => $this->user_label,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at', 'active', 'category'];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->label,
        ];
    }
}
