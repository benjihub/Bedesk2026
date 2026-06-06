<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$groups = \App\Team\Models\Group::all()->pluck('name', 'id');
echo json_encode($groups);
?>