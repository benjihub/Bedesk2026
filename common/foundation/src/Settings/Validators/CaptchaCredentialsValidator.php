<?php

namespace Common\Settings\Validators;

use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class CaptchaCredentialsValidator
{
    const KEYS = [
        'captcha.g_site_key',
        'captcha.g_secret_key',
        'captcha.t_site_key',
        'captcha.t_secret_key',
    ];

    public function fails($settings): array|false
    {
        if (Arr::get($settings, 'captcha.g_secret_key')) {
            return $this->validateRecaptcha($settings);
        } else {
            return $this->validateTurnstile($settings);
        }

        return false;
    }

    protected function validateRecaptcha($settings): array|bool
    {
        try {
            $response = Http::asForm()->post(
                'https://www.google.com/recaptcha/api/siteverify',
                [
                    'response' => 'foo-bar',
                    'secret' => Arr::get($settings, 'captcha.g_secret_key'),
                ],
            );

            if (
                $response['success'] === false &&
                $response['error-codes'][0] !== 'invalid-input-response'
            ) {
                return [
                    'captcha_group' => __('These credentials are not valid'),
                ];
            }
        } catch (Exception $e) {
            return $this->getErrorMessage($e);
        }

        return false;
    }

    protected function validateTurnstile($settings): array|bool
    {
        try {
            $response = Http::post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                [
                    'response' => 'foo-bar',
                    'secret' => Arr::get($settings, 'captcha.t_secret_key'),
                ],
            );

            if (
                $response['success'] === false &&
                $response['error-codes'][0] !== 'invalid-input-response'
            ) {
                return [
                    'captcha_group' => __('These credentials are not valid'),
                ];
            }
        } catch (Exception $e) {
            return $this->getErrorMessage($e);
        }

        return false;
    }

    protected function getErrorMessage(Exception $e): array
    {
        return ['captcha_group' => $e->getMessage()];
    }
}
