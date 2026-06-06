<?php namespace Common\Validation;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class CaptchaTokenValid implements ValidationRule
{
    public function __construct(protected string $formName) {}

    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void {
        if (!settings("captcha.enable.$this->formName")) {
            return;
        }

        if (!$value) {
            $fail('Please solve the captcha challenge.')->translate();
            return;
        }

        $tokenIsValid =
            settings('captcha.provider') === 'turnstile'
                ? $this->verifyTurnstile($value)
                : $this->verifyRecaptcha($value);

        if (!$tokenIsValid) {
            $fail('Could not verify you are human. Try again.')->translate();
        }
    }

    protected function verifyRecaptcha(string $token): bool
    {
        $response = Http::asForm()->post(
            'https://www.google.com/recaptcha/api/siteverify',
            [
                'response' => $token,
                'secret' => settings('captcha.g_secret_key'),
                'remoteip' => request()->getClientIp(),
            ],
        );

        if (!$response->successful()) {
            return false;
        }

        return $response->json('success');
    }

    protected function verifyTurnstile(string $token): bool
    {
        $response = Http::post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            [
                'response' => $token,
                'secret' => settings('captcha.t_secret_key'),
            ],
        );

        if (!$response->successful()) {
            return false;
        }

        return $response->json('success');
    }
}
