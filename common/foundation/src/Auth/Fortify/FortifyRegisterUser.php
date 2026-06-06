<?php

namespace Common\Auth\Fortify;

use App\Models\User;
use Closure;
use Common\Auth\Actions\CreateUser;
use Common\Validation\CaptchaTokenValid;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class FortifyRegisterUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        $invite =
            isset($input['invite_id']) && isset($input['invite_type'])
                ? app(modelTypeToNamespace($input['invite_type']))->find(
                    $input['invite_id'],
                )
                : null;

        if (settings('registration.disable') && !$invite) {
            abort(404);
        }

        $appRules = config('registration-rules') ?? [];
        $commonRules = [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
                function (string $attribute, mixed $value, Closure $fail) {
                    if (!self::emailIsValid($value)) {
                        $fail(__('This domain is blacklisted.'));
                    }
                },
            ],
            'password' => $this->passwordRules(),
            'token_name' => 'string|min:3|max:50',
            'invite_id' => 'string',
            'invite_type' => 'string',
            'captcha_token' => [new CaptchaTokenValid('register')],
        ];

        foreach ($appRules as $key => $rules) {
            $commonRules[$key] = array_map(function ($rule) {
                if (str_contains($rule, '\\')) {
                    $namespace = "\\$rule";
                    return new $namespace();
                }
                return $rule;
            }, $rules);
        }

        if ($invite) {
            $input['email'] = $invite->email;
        }

        $data = Validator::make($input, $commonRules)->validate();

        if ($invite) {
            return $invite->createUser($data);
        }

        return (new CreateUser())->execute($data);
    }

    public static function emailIsValid(string $email): bool
    {
        $blacklistedDomains = explode(
            ',',
            settings('auth.domain_blacklist', ''),
        );
        if ($blacklistedDomains) {
            $domain = explode('@', $email)[1] ?? null;
            if ($domain && in_array($domain, $blacklistedDomains)) {
                return false;
            }
        }

        return true;
    }
}
