<?php

namespace App\Conversations\Email\Validators;

use Common\Settings\Mail\GmailClient;
use Common\Settings\Validators\SettingsValidator;
use Exception;
use Illuminate\Support\Arr;

class GmailApiCredentialsValidator implements SettingsValidator
{
    const KEYS = ['incoming_email'];

    public function fails($values): ?array
    {
        $config = json_decode($values['incoming_email'], true);

        if (Arr::get($config, 'gmail.enabled')) {
            if (!GmailClient::tokenExists()) {
                return [
                    'gmail_group' => __('Gmail account needs to be connected.'),
                ];
            }

            if ($topicName = Arr::get($config, 'gmail.topicName')) {
                settings()->set('incoming_email.gmail.topicName', $topicName);
            }

            // init google pub sub
            try {
                (new GmailClient())->watch();
            } catch (Exception $e) {
                $decoded = json_decode($e->getMessage(), true);
                if (is_array($decoded) && isset($decoded['error']['message'])) {
                    return ['gmail_group' => $decoded['error']['message']];
                } else {
                    return [
                        'gmail_group' => $e->getMessage(),
                    ];
                }
            }
        }

        return null;
    }
}
