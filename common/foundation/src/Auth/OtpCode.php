<?php

namespace Common\Auth;

use Illuminate\Database\Eloquent\Model;

/**
 * 
 *
 * @property int $id
 * @property string $code
 * @property int $user_id
 * @property string $type
 * @property \Illuminate\Support\Carbon $expires_at
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode query()
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode whereCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|OtpCode whereUserId($value)
 * @mixin \Eloquent
 */
class OtpCode extends Model
{
    const TYPE_EMAIL_VERIFICATION = 'email_verification';

    protected $guarded = ['id'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public $timestamps = false;

    public function isExpired(): bool
    {
        return now()->gte($this->expires_at);
    }

    public static function createForEmailVerification(int $userId)
    {
        self::where('user_id', $userId)
            ->where('type', static::TYPE_EMAIL_VERIFICATION)
            ->delete();
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_EMAIL_VERIFICATION,
            'code' => random_int(100000, 999999),
            'expires_at' => now()->addMinutes(30),
        ]);
    }
}
