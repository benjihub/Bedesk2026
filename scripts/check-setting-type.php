<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$setting = Common\Settings\Models\Setting::where('name', 'menus')->first();

var_dump(gettype($setting?->value));
if ($setting) {
	echo substr($setting->getRawOriginal('value'), 0, 120) . PHP_EOL;
}
