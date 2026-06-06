<?php namespace Common\Auth;

use App\Models\User;
use Common\Auth\Notifications\VerifyEmailWithOtp;
use Common\Auth\Permissions\Permission;
use Common\Auth\Permissions\Traits\HasPermissionsRelation;
use Common\Auth\Roles\Role;
use Common\Auth\Traits\Bannable;
use Common\Auth\Traits\HasAvatarAttribute;
use Common\Auth\Traits\HasDisplayNameAttribute;
use Common\Billing\Billable;
use Common\Billing\Models\Product;
use Common\Core\BaseModel;
use Common\Files\FileEntry;
use Common\Files\FileEntryPivot;
use Common\Files\Traits\HasAttachedFileEntries;
use Common\Notifications\NotificationSubscription;
use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Scout\Searchable;

abstract class BaseUser extends BaseModel implements
    HasLocalePreference,
    AuthenticatableContract,
    AuthorizableContract,
    CanResetPasswordContract,
    MustVerifyEmailContract
{
    use Searchable,
        Notifiable,
        Billable,
        TwoFactorAuthenticatable,
        HasAttachedFileEntries,
        HasPermissionsRelation,
        HasAvatarAttribute,
        HasDisplayNameAttribute,
        Authenticatable,
        Authorizable,
        CanResetPassword,
        MustVerifyEmail,
        Bannable;

    const MODEL_TYPE = 'user';

    protected $guarded = [];
    protected $hidden = [
        'password',
        'remember_token',
        'pivot',
        'legacy_permissions',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];
    protected $casts = [
        'id' => 'integer',
        'email_verified_at' => 'datetime',
        'unread_notifications_count' => 'integer',
    ];
    protected $appends = ['has_password', 'model_type'];
    protected bool $billingEnabled = true;

    public function preferredLocale()
    {
        return $this->language;
    }

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->billingEnabled = (bool) settings('billing.enable');
    }

    public function toArray(bool $showAll = false): array
    {
        if (
            (!$showAll && !Auth::id()) ||
            (Auth::id() !== $this->id &&
                !Auth::user()?->hasPermission('users.update'))
        ) {
            $this->hidden = array_merge($this->hidden, [
                'gender',
                'email',
                'card_brand',
                'has_password',
                'confirmed',
                'stripe_id',
                'roles',
                'permissions',
                'card_last_four',
                'created_at',
                'updated_at',
                'email_verified_at',
                'timezone',
                'confirmation_code',
                'subscriptions',
            ]);
        }

        return parent::toArray();
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role');
    }

    public function routeNotificationForSlack()
    {
        return config('services.slack.notifications.channel');
    }

    public function scopeWhereNeedsNotificationFor(
        Builder $query,
        string $notifId,
    ) {
        return $query->whereHas('notificationSubscriptions', function (
            Builder $builder,
        ) use ($notifId) {
            if (Str::contains($notifId, '*')) {
                return $builder->where(
                    'notif_id',
                    'like',
                    str_replace('*', '%', $notifId),
                );
            } else {
                return $builder->where('notif_id', $notifId);
            }
        });
    }

    public function notificationSubscriptions(): HasMany
    {
        return $this->hasMany(NotificationSubscription::class);
    }

    public function entries(array $options = ['owner' => true]): BelongsToMany
    {
        $query = $this->morphToMany(
            FileEntry::class,
            'model',
            'file_entry_models',
            'model_id',
            'file_entry_id',
        )
            ->using(FileEntryPivot::class)
            ->withPivot('owner', 'permissions');

        if (Arr::get($options, 'owner')) {
            $query->wherePivot('owner', true);
        }

        return $query
            ->withTimestamps()
            ->orderBy('file_entry_models.created_at', 'asc');
    }

    public function avatars()
    {
        return $this->attachedFileEntriesRelation('avatar');
    }

    public function userSessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    public function createOrTouchSession()
    {
        return UserSession::createNewOrTouchExisting($this);
    }

    public function touchLastActiveAt()
    {
        return UserSession::createNewOrTouchExisting($this);
    }

    public function latestUserSession(): HasOne
    {
        return $this->hasOne(UserSession::class)->orderBy('updated_at', 'desc');
    }

    public function followedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'follows',
            'follower_id',
            'followed_id',
        )->compact();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'follows',
            'followed_id',
            'follower_id',
        )->compact();
    }

    public function social_profiles(): HasMany
    {
        return $this->hasMany(SocialProfile::class);
    }

    /**
     * Check if user has a password set.
     */
    public function getHasPasswordAttribute(): bool
    {
        return isset($this->attributes['password']) &&
            $this->attributes['password'];
    }

    protected function password(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                if (!$value) {
                    return null;
                }
                if (Hash::isHashed($value)) {
                    return $value;
                }
                return Hash::make($value);
            },
        );
    }

    protected function availableSpace(): Attribute
    {
        return Attribute::make(
            set: fn($value) => !is_null($value) ? (int) $value : null,
        );
    }

    protected function otpCodes(): HasMany
    {
        return $this->hasMany(OtpCode::class);
    }

    public function emailVerificationOtpIsValid(string $code): bool
    {
        $otp = $this->otpCodes()
            ->where('type', OtpCode::TYPE_EMAIL_VERIFICATION)
            ->first();

        if (!$otp || $otp->code !== $code || $otp->isExpired()) {
            return false;
        }

        return true;
    }

    protected function emailVerifiedAt(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                if ($value === true) {
                    return now();
                } elseif ($value === false) {
                    return null;
                }
                return $value;
            },
        );
    }

    public function sendEmailVerificationNotification(): void
    {
        // there's no easy way to disable laravel's default SendEmailVerificationNotification listener,
        // so we just dont do anything here, if email confirmation is disabled
        if (!settings('require_email_confirmation')) {
            return;
        }

        $otp = OtpCode::createForEmailVerification($this->id);
        $this->notify(new VerifyEmailWithOtp($otp->code));
    }

    public function markEmailAsVerified(): bool
    {
        $this->otpCodes()
            ->where('type', OtpCode::TYPE_EMAIL_VERIFICATION)
            ->delete();
        return $this->forceFill([
            'email_verified_at' => $this->freshTimestamp(),
        ])->save();
    }

    public function loadPermissions($force = false): self
    {
        if (!$force && $this->relationLoaded('permissions')) {
            return $this;
        }

        $query = Permission::where('permissions.type', 'users')->join(
            'permissionables',
            'permissions.id',
            'permissionables.permission_id',
        );

        // Might have a guest user. In this case user ID will be -1,
        // but we still want to load guest role permissions below
        $query->where(function (Builder $query) {
            if ($this->exists) {
                $query->where([
                    'permissionable_id' => $this->id,
                    'permissionable_type' => $this->getMorphClass(),
                ]);
            }

            if ($this->roles->pluck('id')->isNotEmpty()) {
                $query->orWhere(function (Builder $builder) {
                    return $builder
                        ->whereIn(
                            'permissionable_id',
                            $this->roles->pluck('id'),
                        )
                        ->where(
                            'permissionable_type',
                            $this->roles->first()->getMorphClass(),
                        );
                });
            }

            if ($this->exists && ($plan = $this->getSubscriptionProduct())) {
                $query->orWhere(function (Builder $builder) use ($plan) {
                    return $builder
                        ->where('permissionable_id', $plan->id)
                        ->where('permissionable_type', $plan->getMorphClass());
                });
            }
        });

        $permissions = $query
            ->select([
                'permissions.id',
                'name',
                'permissionables.restrictions',
                'permissionable_type',
            ])
            ->get()
            ->sortBy(function ($value) {
                if ($value['permissionable_type'] === $this->getMorphClass()) {
                    return 1;
                } elseif (
                    $value['permissionable_type'] === Product::MODEL_TYPE
                ) {
                    return 2;
                } else {
                    return 3;
                }
            })
            ->groupBy('id')

            // merge restrictions from all permissions
            ->map(function (Collection $group) {
                return $group->reduce(function (
                    Permission $carry,
                    Permission $permission,
                ) {
                    return $carry->mergeRestrictions($permission);
                }, $group[0]);
            });

        $this->setRelation('permissions', $permissions->values());

        return $this;
    }

    public function getSubscriptionProduct(): ?Product
    {
        if (!$this->billingEnabled) {
            return null;
        }

        $subscription = $this->subscriptions->first();

        if ($subscription && $subscription->valid()) {
            return $subscription->product;
        } else {
            return Product::where('free', true)->first();
        }
    }

    public function scopeCompact(Builder $query): Builder
    {
        return $query->select(
            'users.id',
            'users.image',
            'users.email',
            'users.name',
            'users.username',
        );
    }

    public function sendPasswordResetNotification(mixed $token)
    {
        ResetPassword::$createUrlCallback = function ($user, $token) {
            return url("password/reset/$token");
        };
        $this->notify(new ResetPassword($token));
    }

    public static function findAdmin(): ?self
    {
        return (new static())
            ->newQuery()
            ->whereHas('permissions', function (Builder $query) {
                $query->where('name', 'admin');
            })
            ->first();
    }

    public function refreshApiToken($tokenName): string
    {
        $this->tokens()->where('name', $tokenName)->delete();
        $newToken = $this->createToken($tokenName);
        $this->withAccessToken($newToken->accessToken);
        return $newToken->plainTextToken;
    }

    public function resolveRouteBinding($value, $field = null): ?self
    {
        if ($value === 'me') {
            $value = Auth::id();
        }
        return $this->where('id', $value)->firstOrFail();
    }

    public function makeSearchableUsing(Collection $models)
    {
        return $models->load([
            'userSessions' => fn($q) => $q->limit(1),
        ]);
    }

    protected function makeAllSearchableUsing($query)
    {
        return $query->with(['userSessions' => fn($q) => $q->limit(1)]);
    }

    public function toSearchableArray(): array
    {
        $session = $this->userSessions->first();
        return [
            'id' => $this->id,
            'username' => $this->username,
            'type' => $this->type,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
            'email_verified_at' =>
                $this->email_verified_at->timestamp ?? '_null',
            'last_active_at' => $session->updated_at->timestamp ?? '_null',
            'country' => $session->country ?? $this->country,
            'city' => $session->city ?? null,
            'timezone' => $this->timezone,
            'language' => $this->language,
            'browser' => $session->browser ?? null,
            'platform' => $session->platform ?? null,
            'device' => $session->device ?? null,
        ];
    }

    public static function filterableFields(): array
    {
        return [
            'id',
            'type',
            'created_at',
            'updated_at',
            'last_active_at',
            'email_verified_at',
            'country',
            'city',
            'timezone',
            'language',
            'browser',
            'platform',
            'device',
        ];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->email,
            'image' => $this->image,
            'model_type' => static::MODEL_TYPE,
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return static::MODEL_TYPE;
    }
}
