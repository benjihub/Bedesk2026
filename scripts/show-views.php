<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Conversations\Models\ConversationView;

$views = ConversationView::select('id', 'key', 'name', 'active', 'internal')->get();

print_r($views->toArray());
