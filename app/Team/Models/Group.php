<?php

namespace App\Team\Models;

use App\Models\User;
use App\Team\Factories\GroupFactory;
use App\Team\Models\GroupAiAgentSettings;
use App\Team\Models\GroupSettings;
use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Scout\Searchable;

class Group extends BaseModel
{
    use Searchable;

    public const MODEL_TYPE = 'group';

    protected $guarded = ['id'];

    protected $casts = [
        'default' => 'boolean',
    ];

    protected $hidden = ['created_at', 'updated_at', 'pivot'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('conversation_priority')
            ->orderBy('group_user.created_at');
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(GroupPromotion::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(GroupSettings::class);
    }

    public function aiAgentSettings(): HasOne
    {
        return $this->hasOne(GroupAiAgentSettings::class);
    }

    public static function findDefault(): self|null
    {
        return static::where('default', true)->first();
    }

    public static function filterableFields(): array
    {
        return ['id', 'default', 'created_at', 'updated_at'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => null,
            'image' => null,
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
