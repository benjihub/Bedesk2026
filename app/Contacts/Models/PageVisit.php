<?php

namespace App\Contacts\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageVisit extends Model
{
    const MODEL_TYPE = 'pageVisit';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'ended_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function forUser(User $user): Builder
    {
        return static::where('user_id', $user->id);
    }

    public function getDurationInSeconds(): int
    {
        $endedAt = $this->ended_at ?? now();
        return $this->created_at->diffInSeconds($endedAt);
    }
}
