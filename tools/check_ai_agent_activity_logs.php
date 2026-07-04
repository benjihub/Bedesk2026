<?php

use Ai\AiAgent\Models\AiAgentActivityLog;
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

if (!Schema::hasTable('ai_agent_activity_logs')) {
    fwrite(STDOUT, "Table ai_agent_activity_logs does not exist.\n");
    exit(0);
}

$count = AiAgentActivityLog::query()->count();
fwrite(STDOUT, "ai_agent_activity_logs count: {$count}\n");

$rows = AiAgentActivityLog::query()
    ->orderByDesc('id')
    ->limit(10)
    ->get([
        'id',
        'created_at',
        'group_id',
        'ai_agent_id',
        'conversation_id',
        'agent_name',
        'status',
        'response_time_ms',
        'total_tokens',
    ]);

foreach ($rows as $row) {
    fwrite(
        STDOUT,
        sprintf(
            "#%d %s group=%s agent_id=%s conv=%s name=%s status=%s ms=%s tokens=%s\n",
            $row->id,
            (string) $row->created_at,
            $row->group_id === null ? 'null' : (string) $row->group_id,
            $row->ai_agent_id === null ? 'null' : (string) $row->ai_agent_id,
            (string) $row->conversation_id,
            (string) $row->agent_name,
            (string) $row->status,
            $row->response_time_ms === null ? 'null' : (string) $row->response_time_ms,
            $row->total_tokens === null ? 'null' : (string) $row->total_tokens,
        )
    );
}

