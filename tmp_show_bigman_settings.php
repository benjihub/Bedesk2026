<?php

use App\Team\Models\GroupAiAgentSettings;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\\Contracts\\Console\\Kernel');
$kernel->bootstrap();

$rows = GroupAiAgentSettings::query()->get();

if ($rows->isEmpty()) {
    echo "No GroupAiAgentSettings records found.\n";
    exit(0);
}

foreach ($rows as $row) {
    $overrides = is_array($row->overrides ?? null) ? $row->overrides : [];
    $bigman = is_array($overrides['bigman'] ?? null) ? $overrides['bigman'] : [];

    $token = $bigman['token'] ?? null;
    $deposit = $bigman['depositEndpoint'] ?? null;
    $withdraw = $bigman['withdrawEndpoint'] ?? null;

    // For readability, show only the first/last 4 chars of the token if present.
    if (is_string($token) && $token !== '') {
        $short = substr($token, 0, 4) . '...' . substr($token, -4);
    } else {
        $short = '[none]';
    }

    echo "Group ID: {$row->group_id}\n";
    echo "  BigMan token: {$short}\n";
    echo "  Deposit endpoint: " . ($deposit ?: '[default]') . "\n";
    echo "  Withdraw endpoint: " . ($withdraw ?: '[default]') . "\n";
    echo "-----------------------------\n";
}

exit(0);
