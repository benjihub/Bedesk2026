<?php

namespace Common\Workspaces;

use App\Models\User;
use Common\Auth\Traits\HasAvatarAttribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceInvite extends Model
{
    use HasAvatarAttribute;

    protected $guarded = ['id'];
    protected $appends = ['name', 'model_type'];

    protected $keyType = 'orderedUuid';
    public $incrementing = false;

    protected $casts = [
        'user_id' => 'integer',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getNameAttribute(): string
    {
        return explode('@', $this->email)[0];
    }

    public static function getModelTypeAttribute(): string
    {
        return 'invite';
    }
}
