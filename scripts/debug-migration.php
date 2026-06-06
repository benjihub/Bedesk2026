<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Common\Settings\Models\Setting;

$setting = Setting::where('name', 'menus')->first();

if (!$setting || !is_array($setting->value)) {
    echo "no menus" . PHP_EOL;
    exit;
}

$menus = $setting->value;
$didUpdate = false;

$ensure = function (array $items, string $action, bool &$didUpdate) {
    $existing = collect($items)->first(
        fn($item) => ($item['action'] ?? null) === $action,
    );

    if ($existing) {
        return $items;
    }

    $items[] = [
        'label' => 'AI Agent',
        'action' => $action,
        'type' => 'route',
        'id' => $action === '/admin/ai-agent' ? 'aiadm1' : 'aidas1',
        'permissions' => ['ai_agent.update'],
    ];

    $didUpdate = true;
    var_dump(['setFlag' => $didUpdate, 'action' => $action]);

    return $items;
};

foreach ($menus as $index => $menu) {
    $positions = $menu['positions'] ?? [];
    $items = $menu['items'] ?? [];

    if (in_array('admin-sidebar', $positions)) {
        $items = $ensure($items, '/admin/ai-agent', $didUpdate);
    }

    if (in_array('dashboard-sidebar', $positions)) {
        $items = $ensure($items, '/dashboard/ai-agent', $didUpdate);
    }

    $menu['items'] = $items;
    $menus[$index] = $menu;
}

var_dump($didUpdate);
print_r($menus[0]['items'][count($menus[0]['items']) - 1]);
print_r($menus[1]['items'][count($menus[1]['items']) - 1]);

$flag = false;
$tester = function (bool &$value) {
    $value = true;
};
$tester($flag);
var_dump(['afterTester' => $flag]);

function foo(bool &$flag) {
    $flag = true;
}

$flag2 = false;
foo($flag2);
var_dump(['afterFunction' => $flag2]);
