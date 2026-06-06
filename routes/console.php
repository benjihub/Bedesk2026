<?php

use App\Conversations\Commands\DeleteTestConversationsCommand;
use App\Conversations\Email\Commands\ImportEmailsViaImap;
use App\Conversations\Email\Commands\RefreshGmailSubscription;
use App\Core\Commands\ResetDemoSiteCommand;
use Illuminate\Support\Facades\Schedule;

if (config('app.demo')) {
    Schedule::command(ResetDemoSiteCommand::class)->dailyAt('03:25');
}

if ($imapConnections = settings('incoming_email.imap.connections')) {
    foreach ($imapConnections as $connection) {
        if (
            $connection['createTickets'] ||
            $connection['createReplies']
        ) {
            Schedule::command(ImportEmailsViaImap::class, [$connection['id']])
                ->everyMinute()
                ->withoutOverlapping(1);
        }
    }
}

if (settings('incoming_email.gmail.enabled')) {
    Schedule::command(RefreshGmailSubscription::class)
        ->daily()
        ->withoutOverlapping();
}

Schedule::command(DeleteTestConversationsCommand::class)
    ->hourly();

