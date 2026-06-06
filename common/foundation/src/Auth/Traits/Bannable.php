<?php

namespace Common\Auth\Traits;

use App\Models\User;
use Common\Auth\Ban;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

trait Bannable
{
    public function bans(): MorphMany
    {
        return $this->morphMany(Ban::class, 'bannable');
    }

    public function isBanned(): bool
    {
        if (!$this->getAttributeValue('banned_at')) {
            return false;
        }

        $bannedUntil = $this->bans->first()->expired_at;

        return !$bannedUntil || $bannedUntil->isFuture();
    }

    public function createBan(array $data): void
    {
        $this->bans()->create([
            'expired_at' => $data['permanent']
                ? null
                : Arr::get($data, 'ban_until'),
            'comment' => Arr::get($data, 'comment'),
            'created_by_type' => User::MODEL_TYPE,
            'created_by_id' => Auth::id(),
        ]);

        $this->fill(['banned_at' => now()])->save();
    }

    public function unban(): void
    {
        $this->bans()->delete();
        $this->fill(['banned_at' => null])->save();
    }
}
