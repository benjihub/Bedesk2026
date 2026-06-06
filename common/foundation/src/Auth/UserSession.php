<?php

namespace Common\Auth;

use App\Models\User;
use Common\Auth\Factories\UserSessionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Jenssegers\Agent\Agent;
use Laravel\Sanctum\PersonalAccessToken;

class UserSession extends Model
{
    use HasFactory;

    protected $guarded = [];

    const MODEL_TYPE = 'userSession';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public static function createNewOrTouchExisting(User $user): static
    {
        $sessionId = session()->getId();
        $accessToken = $user->currentAccessToken();
        $token =
            $accessToken instanceof PersonalAccessToken
                ? $accessToken->token
                : null;

        $existingSession = UserSession::query()
            ->when(
                $sessionId,
                fn($query) => $query->where('session_id', $sessionId),
            )
            ->when($token, fn($query) => $query->where('token', $token))
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if ($existingSession) {
            $existingSession->touch('updated_at');
            return $existingSession;
        } else {
            $geo = geoip(getIp());
            $technology = app(Agent::class);

            $data = [
                'user_id' => $user->id,
                'ip_address' => getIp(),
                'user_agent' => Str::limit(request()->userAgent(), 500),
                'browser' => $technology->browser() ?: 'unknown',
                'country' => strtolower($geo['iso_code']),
                'city' => $geo['city'],
                'platform' => $technology->platform() ?: 'unknown',
                'device' => $technology->deviceType() ?: 'unknown',
                'session_id' => $sessionId,
                'token' => $token,
            ];

            return static::create($data);
        }
    }

    protected static function newFactory()
    {
        return UserSessionFactory::new();
    }
}
