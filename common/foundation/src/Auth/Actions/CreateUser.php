<?php

namespace Common\Auth\Actions;

use App\Models\User;
use Common\Auth\Events\UserCreated;
use Common\Auth\Permissions\Traits\SyncsPermissions;
use Common\Auth\Roles\Role;
use Common\Core\Values\ValueLists;

class CreateUser
{
    use SyncsPermissions;

    public function execute(array $params): User
    {
        if (
            !settings('require_email_confirmation') &&
            !array_key_exists('email_verified_at', $params) &&
            isset($params['email'])
        ) {
            $params['email_verified_at'] = now();
        }

        $geo = geoip(getIp());
        $user = User::create([
            'name' => $params['name'] ?? null,
            'username' => $params['username'] ?? null,
            'image' => $params['image'] ?? null,
            'password' => $params['password'] ?? null,
            'email' => $params['email'] ?? null,
            'language' => $params['language'] ?? config('app.locale'),
            'country' => $params['country'] ?? ($geo['iso_code'] ?? null),
            'timezone' => $this->getValidTimezone($params, $geo),
            'email_verified_at' => $params['email_verified_at'] ?? null,
            'created_at' => $params['created_at'] ?? now(),
            'updated_at' => $params['updated_at'] ?? now(),
            'type' => $params['type'] ?? 'user',
        ]);

        if (isset($params['secondary_email'])) {
            $user->secondaryEmails()->create([
                'address' => $params['secondary_email'],
            ]);
        }

        if (array_key_exists('roles', $params)) {
            $user->roles()->attach($params['roles']);
        }

        // if no roles were attached, assign default role
        if ($user->roles()->count() === 0) {
            $defaultRole = app(Role::class)->getDefaultRole();
            if ($defaultRole) {
                $user->roles()->attach($defaultRole->id);
            }
        }

        if (array_key_exists('permissions', $params)) {
            $this->syncPermissions($user, $params['permissions']);
        }

        event(new UserCreated($user, $params));

        return $user;
    }

    protected function getValidTimezone(array $params, mixed $geoData): string
    {
        $preferred = $params['timezone'] ?? ($geoData['timezone'] ?? null);
        $all = collect(app(ValueLists::class)->timezones())
            ->values()
            ->flatten(1)
            ->pluck('value');
        return $all->contains($preferred) ? $preferred : 'UTC';
    }
}
