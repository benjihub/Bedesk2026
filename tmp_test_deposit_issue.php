<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Ai\AiAgent\Conversations\GroupReplyEngine;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;

$template = Conversation::query()->latest('id')->first();
if (! $template) {
    echo "No conversations found.\n";
    exit(1);
}

// make sure the group has a depositFlow override so we can verify it's applied
$groupId = $template->group_id;
if ($groupId) {
    // merge with existing overrides, preserving other keys
    $record = App\Team\Models\GroupAiAgentSettings::query()->firstOrNew(['group_id' => $groupId]);
    $over = is_array($record->overrides) ? $record->overrides : [];
    $over['depositFlow'] = array_merge($over['depositFlow'] ?? [], [
        'askUsername' => 'OVERRIDE USERNAME TEMPLATE',
        'askProof' => 'OVERRIDE PROOF TEMPLATE',
    ]);
    $record->overrides = $over;
    $record->save();
    echo "Saved overrides: \n" . json_encode($record->overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

$key = 'deposit_issue';
$body = 'bos depo 200k belum masuk dari tadi, tolong cek';

$conversation = $template->replicate();
$conversation->id = null;
// avoid overly long subjects
$conversation->subject = 'AI single flow test ' . $key;
$conversation->assigned_to = Conversation::ASSIGNED_BOT;
$conversation->save();

// Add a separate conversation to check limit query behavior
$limitConv = $template->replicate();
$limitConv->id = null;
$limitConv->subject = 'AI test limit';
$limitConv->assigned_to = Conversation::ASSIGNED_BOT;
$limitConv->save();

echo "=== FLOW CASE: {$key} (conversation {$conversation->id}) ===\n";

// First user message: deposit problem
echo "USER1: {$body}\n";
$item1 = new ConversationItem();
$item1->conversation_id = $conversation->id;
$item1->type = 'message';
$item1->author = Conversation::AUTHOR_USER;
$item1->body = $body;
$item1->save();

$engine = new GroupReplyEngine($conversation);
// debug: show what settings the engine resolved for this conversation/group
$ref = new ReflectionMethod(GroupReplyEngine::class, 'resolveAiSettings');
$ref->setAccessible(true);
$resolved = $ref->invoke($engine);
echo "Resolved AI settings (partial):\n" . json_encode($resolved, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . "\n";
$engine->handleLatestUserMessage();

$bot1 = ConversationItem::query()
    ->where('conversation_id', $conversation->id)
    ->where('type', 'message')
    ->where('author', Conversation::AUTHOR_BOT)
    ->orderByDesc('id')
    ->first();

if (! $bot1) {
    echo "No first bot reply created.\n";
    exit(0);
}

echo "BOT1: " . $bot1->body . "\n";
$ai1 = $bot1->data['ai_group_reply'] ?? null;
if (is_array($ai1)) {
    $intent1 = $ai1['intent'] ?? 'null';
    $status1 = $ai1['status'] ?? 'null';
    $ctx1 = $ai1['context'] ?? [];
    echo "intent1={$intent1} status1={$status1}\n";
    $flags1 = [
        'awaitingUserId' => $ctx1['awaitingUserId'] ?? null,
        'processing' => $ctx1['processing'] ?? null,
        'deposit_check' => $ctx1['deposit_check'] ?? null,
        'flowType' => $ctx1['userIdFlowType'] ?? null,
    ];
    print_r($flags1);
}

$session = $conversation->aiAgentSession()->first();
echo "SESSION CONTEXT AFTER BOT1:\n";
var_dump($session?->context);

// Second user message: username
$userIdText = 'user123';
echo "USER2: {$userIdText}\n";
$item2 = new ConversationItem();
$item2->conversation_id = $conversation->id;
$item2->type = 'message';
$item2->author = Conversation::AUTHOR_USER;
$item2->body = $userIdText;
$item2->save();

$engine->handleLatestUserMessage();

$bot2 = ConversationItem::query()
    ->where('conversation_id', $conversation->id)
    ->where('type', 'message')
    ->where('author', Conversation::AUTHOR_BOT)
    ->orderByDesc('id')
    ->first();

if (! $bot2) {
    echo "No second bot reply created.\n";
    exit(0);
}

echo "BOT2: " . $bot2->body . "\n";
$ai2 = $bot2->data['ai_group_reply'] ?? null;
if (is_array($ai2)) {
    $intent2 = $ai2['intent'] ?? 'null';
    $status2 = $ai2['status'] ?? 'null';
    $ctx2 = $ai2['context'] ?? [];
    echo "intent2={$intent2} status2={$status2}\n";
    $flags2 = [
        'awaitingUserId' => $ctx2['awaitingUserId'] ?? null,
        'processing' => $ctx2['processing'] ?? null,
        'deposit_check' => $ctx2['deposit_check'] ?? null,
        'flowType' => $ctx2['userIdFlowType'] ?? null,
    ];
    print_r($flags2);
}

$session = $conversation->aiAgentSession()->first();
echo "SESSION CONTEXT AFTER BOT2:\n";
var_dump($session?->context);

// Third user message: confirm username
$confirm = 'iya';
echo "USER3: {$confirm}\n";
$item3 = new ConversationItem();
$item3->conversation_id = $conversation->id;
$item3->type = 'message';
$item3->author = Conversation::AUTHOR_USER;
$item3->body = $confirm;
$item3->save();

$engine->handleLatestUserMessage();

$bot3 = ConversationItem::query()
    ->where('conversation_id', $conversation->id)
    ->where('type', 'message')
    ->where('author', Conversation::AUTHOR_BOT)
    ->orderByDesc('id')
    ->first();

if ($bot3) {
    echo "BOT3: " . $bot3->body . "\n";
    $ai3 = $bot3->data['ai_group_reply'] ?? null;
    if (is_array($ai3)) {
        $intent3 = $ai3['intent'] ?? 'null';
        $status3 = $ai3['status'] ?? 'null';
        $ctx3 = $ai3['context'] ?? [];
        echo "intent3={$intent3} status3={$status3}\n";
        $flags3 = [
            'awaitingUserId' => $ctx3['awaitingUserId'] ?? null,
            'processing' => $ctx3['processing'] ?? null,
            'deposit_check' => $ctx3['deposit_check'] ?? null,
            'flowType' => $ctx3['userIdFlowType'] ?? null,
        ];
        print_r($flags3);
    }
}

$session = $conversation->aiAgentSession()->first();
echo "SESSION CONTEXT AFTER BOT3:\n";
var_dump($session?->context);

// Fourth user message: unrelated text that doesn't look like deposit
$random = 'What is the RTP link?';
echo "USER4: {$random}\n";
$item4 = new ConversationItem();
$item4->conversation_id = $conversation->id;
$item4->type = 'message';
$item4->author = Conversation::AUTHOR_USER;
$item4->body = $random;
$item4->save();

try {
    $engine->handleLatestUserMessage();
} catch (\Throwable $e) {
    echo "(engine crashed after USER3: " . $e->getMessage() . ")\n";
}

$bot3 = ConversationItem::query()
    ->where('conversation_id', $conversation->id)
    ->where('type', 'message')
    ->where('author', Conversation::AUTHOR_BOT)
    ->orderByDesc('id')
    ->first();

echo "BOT3: " . ($bot3?->body ?? '(none)') . "\n";
$ai3 = $bot3?->data['ai_group_reply'] ?? null;
if (is_array($ai3)) {
    $intent3 = $ai3['intent'] ?? 'null';
    $status3 = $ai3['status'] ?? 'null';
    $ctx3 = $ai3['context'] ?? [];
    echo "intent3={$intent3} status3={$status3}\n";
    $flags3 = [
        'awaitingUserId' => $ctx3['awaitingUserId'] ?? null,
        'processing' => $ctx3['processing'] ?? null,
        'deposit_check' => $ctx3['deposit_check'] ?? null,
        'flowType' => $ctx3['userIdFlowType'] ?? null,
    ];
    print_r($flags3);
}

$session = $conversation->aiAgentSession()->first();
echo "SESSION CONTEXT AFTER BOT3:\n";
var_dump($session?->context);

// === limit query test ===
echo "\n=== LIMIT QUERY TEST ===\n";
$limitText = 'Bosku minimal depo berapa main dsitus ini';
echo "USER: {$limitText}\n";
$limitMsg = new ConversationItem();
$limitMsg->conversation_id = $limitConv->id;
$limitMsg->type = 'message';
$limitMsg->author = Conversation::AUTHOR_USER;
$limitMsg->body = $limitText;
$limitMsg->save();
$engine2 = new GroupReplyEngine($limitConv);
$engine2->handleLatestUserMessage();
$botLimit = ConversationItem::query()
    ->where('conversation_id', $limitConv->id)
    ->where('type', 'message')
    ->where('author', Conversation::AUTHOR_BOT)
    ->orderByDesc('id')
    ->first();
if ($botLimit) {
    echo "BOT: " . $botLimit->body . "\n";
    $aiL = $botLimit->data['ai_group_reply'] ?? null;
    if (is_array($aiL)) {
        echo 'intent=' . ($aiL['intent'] ?? 'null') . ' status=' . ($aiL['status'] ?? 'null') . "\n";
    }
}
