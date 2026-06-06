<?php

namespace App\Contacts\Traits;

use App\Contacts\Models\Email;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

trait CanHaveSecondaryEmails
{
    public function secondaryEmails(): HasMany
    {
        return $this->hasMany(Email::class);
    }

    public function secondaryEmail(): HasOne
    {
        return $this->hasOne(Email::class)->orderBy('id', 'desc');
    }

    public function routeNotificationForMail()
    {
        return $this->email ?? $this->secondaryEmail?->address;
    }

    public function getEmailForPasswordReset()
    {
        return $this->routeNotificationForMail();
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn(string|null $value) => $value ??
                ($this->relationLoaded('secondaryEmail')
                    ? $this->secondaryEmail?->address
                    : null),
        );
    }

    public static function findBySecondaryEmail(string $email): ?static
    {
        return static::query()
            ->whereHas(
                'secondaryEmails',
                fn(Builder $q) => $q->where('address', $email),
            )
            ->first();
    }
}
