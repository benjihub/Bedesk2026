<?php

namespace App\Conversations\Email\Validators;

use Common\Settings\Validators\SettingsValidator;
use Exception;
use Illuminate\Support\Arr;
use Webklex\PHPIMAP\ClientManager;

class ImapCredentialsValidator implements SettingsValidator
{
    const KEYS = ['incoming_email'];

    public function fails($values): ?array
    {
        $connections =
            json_decode($values['incoming_email'], true)['imap'][
                'connections'
            ] ?? [];

        foreach ($connections as $connection) {
            try {
                $client = new ClientManager([
                    'accounts' => [
                        'default' => Arr::only($connection, [
                            'host',
                            'port',
                            'username',
                            'password',
                        ]),
                    ],
                ]);
                $client->connect();
                $client
                    ->getFolder($connection['folder'] ?? 'INBOX')
                    ->messages()
                    ->all()
                    ->count();
            } catch (Exception $e) {
                return [
                    'imap_group' => $e->getMessage(),
                ];
            }
        }

        return null;
    }
}
