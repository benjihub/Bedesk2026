<?php

return [
    'mailers' => [
        'gmailApi' => [
            'transport' => 'gmailApi',
        ],
        'mailgun' => [
            'transport' => 'mailgun',
        ],
    ],
    'enable_contact_page' => env('ENABLE_CONTACT_PAGE', false),
];
