<?php

namespace Livechat\Widget\Users;

use App\Contacts\Events\HelpDeskUserCreated;
use App\Models\User;
use Common\Core\Middleware\SetAppLocale;
use Illuminate\Support\Arr;
use Livechat\Widget\Middleware\AuthenticateWidget;

class ResolveWidgetCustomer
{
    public function execute(int|null $mainSessionUserId = null): void
    {
        $externalData = $this->getExternalUserData();
        $isWidgetHome = request()->routeIs('chatWidgetHome');
        $isAiAgentPreviewMode = request()->routeIs('aiAgentPreviewMode');
        $emailHash = Arr::pull($externalData, 'email_hash');
        $visitorId = request()->header('X-Widget-Visitor') ?? request('visitorId');
        if (!is_string($visitorId) || $visitorId === '') {
            $visitorId = null;
        }

        // if enforce hmac is enabled and no email hash is provided, bail
        if (
            !empty($externalData) &&
            settings('lc.enforce_hmac') &&
            !$emailHash
        ) {
            return;
        }

        // in conversation preview mode, login the agent/admin that is testing the converastion
        if ($isAiAgentPreviewMode) {
            if (!auth('chatWidget')->check()) {
                $user = User::findOrFail($mainSessionUserId);
                $this->setUserOnSession($user);
            }
            return;
        }

        // if email hash is provided, use this to auth user, overriding user set in laravel session cookie
        if (
            $emailHash &&
            isset($externalData['email']) &&
            $isWidgetHome &&
            $this->hashMatches($externalData['email'], $emailHash)
        ) {
            $email = $externalData['email'];
            $externalData = Arr::except($externalData, ['email_hash', 'email']);
            if ($user = User::where('email', $email)->first()) {
                $newUser = $user;
                $this->insertCustomFields($newUser, $externalData);
            } else {
                $newUser = $this->createNewUser(
                    $externalData,
                    primaryEmail: $email,
                );
            }

            $this->setUserOnSession($newUser);
            return;
        }

        // already logged in, only update attributes
        if (auth('chatWidget')->check()) {
            if (!empty($externalData)) {
                $this->insertCustomFields(
                    auth('chatWidget')->user(),
                    $externalData,
                );
            }
            return;
        }

        // For all widget routes (including API requests), if we have a
        // persistent visitor id and are not already authenticated, try to
        // reuse the same customer record based on that visitor id.
        if ($visitorId && !auth('chatWidget')->check()) {
            if ($existing = $this->findUserByVisitorId($visitorId)) {
                if (!empty($externalData)) {
                    $this->insertCustomFields($existing, $externalData);
                }
                $this->setUserOnSession($existing);
                return;
            }
        }

        // only create new user on widget boostrap route
        if ($isWidgetHome && !auth('chatWidget')->check()) {
            // Ensure new user created for this visitor carries the visitorId
            // so we can look it up on subsequent widget bootstraps and API
            // calls.
            if ($visitorId) {
                $externalData = array_merge(['visitorId' => $visitorId], $externalData);
            }

            $newUser = $this->createNewUser($externalData);
            $this->setUserOnSession($newUser);
        }
    }

    protected function findUserByVisitorId(?string $visitorId): ?User
    {
        if (!$visitorId) {
            return null;
        }

        return User::whereHas('customAttributes', function ($query) use ($visitorId) {
            $query->where('key', 'visitorId')->where('value', $visitorId);
        })->first();
    }

    protected function createNewUser(
        array $externalData,
        string|null $primaryEmail = null,
    ): User {
        $ip = getIp();
        $geo = geoip($ip) ?: [];
        $language = isset($externalData['language'])
            ? $externalData['language']
            : SetAppLocale::resolveLanguageFromRequest(request());

        $country = $geo['iso_code'] ?? null;
        $timezone = $geo['timezone'] ?? null;

        $user = User::create([
            'name' => $externalData['name'] ?? null,
            'email' => $primaryEmail ?? null,
            'country' => $country,
            'language' => $language,
            'timezone' => $timezone,
            'type' => 'user',
        ]);

        // name and email will be handled here already, no need to update it again
        if (!empty($externalData)) {
            $this->insertCustomFields($user, $externalData);
        }

        event(new HelpDeskUserCreated($user, 'chatWidget'));

        return $user;
    }

    protected function getExternalUserData(): array
    {
        $data = request()->get('user');

        if ($data) {
            try {
                return json_decode(base64_decode($data), true);
            } catch (\Exception $e) {
            }
        }

        return [];
    }

    protected function hashMatches(string $email, string $hash): bool
    {
        return hash_hmac('sha256', $email, config('app.widget_hmac_secret')) ===
            $hash;
    }

    protected function setUserOnSession(User $user): void
    {
        session()->put(AuthenticateWidget::widgetCustomerKey, $user->id);
        auth('chatWidget')->setUser($user);
    }

    protected function insertCustomFields(User $user, array $externalData)
    {
        $user->updateCustomAttributes($externalData);
    }
}
