<?php

return [
    // dates
    ['name' => 'dates.format', 'value' => 'short'],
    ['name' => 'dates.locale', 'value' => 'en_US'],
    ['name' => 'dates.default_timezone', 'value' => 'auto'],
    ['name' => 'locale.default', 'value' => 'auto'],

    // social login
    ['name' => 'social.google.enable', 'value' => false],
    ['name' => 'social.twitter.enable', 'value' => false],
    ['name' => 'social.facebook.enable', 'value' => false],
    ['name' => 'social.compact_buttons', 'value' => false],

    // real time
    ['name' => 'realtime.enable', 'value' => false],

    // temp
    ['name' => 'registration.disable', 'value' => false],

    // cache
    ['name' => 'cache.report_minutes', 'value' => 60],

    // logos
    [
        'name' => 'branding.logo_dark',
        'value' => 'images/logo-dark.svg',
    ],
    [
        'name' => 'branding.logo_light',
        'value' => 'images/logo-light.svg',
    ],

    // translations
    ['name' => 'i18n.default_localization', 'value' => 'en'],
    ['name' => 'i18n.enable', 'value' => true],

    // sentry
    ['name' => 'logging.sentry_public', 'value' => null],

    // pusher
    ['name' => 'realtime.pusher_key', 'value' => null],

    // menus
    ['name' => 'menus', 'value' => json_encode([])],

    // homepage
    ['name' => 'homepage.type', 'value' => 'default'],

    // themes
    ['name' => 'themes.user_change', 'value' => true],
    ['name' => 'themes.default_id', 'value' => 0],

    // billing
    ['name' => 'billing.enable', 'value' => false],
    ['name' => 'billing.paypal_test_mode', 'value' => true],
    ['name' => 'billing.stripe_test_mode', 'value' => true],
    ['name' => 'billing.stripe.enable', 'value' => false],
    ['name' => 'billing.paypal.enable', 'value' => false],

    // GDPR
    ['name' => 'cookie_notice.enable', 'value' => false],
    ['name' => 'cookie_notice.position', 'value' => 'bottom'],
];
