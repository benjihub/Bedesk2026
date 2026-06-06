<?php namespace Common\Auth;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 *
 *
 * @property int $id
 * @property int $user_id
 * @property string $service_name
 * @property string $user_service_id
 * @property string|null $username
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $access_token
 * @property string|null $refresh_token
 * @property \Illuminate\Support\Carbon|null $access_expires_at
 * @property-read string $model_type
 * @property-read User|null $user
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile query()
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereAccessExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereAccessToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereRefreshToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereServiceName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereUserServiceId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|SocialProfile whereUsername($value)
 * @mixin \Eloquent
 */
class SocialProfile extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'access_expires_at' => 'datetime',
    ];

    const MODEL_TYPE = 'social_profile';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
