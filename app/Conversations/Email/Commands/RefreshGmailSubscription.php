<?php

namespace App\Conversations\Email\Commands;

use Common\Settings\Mail\GmailClient;
use Illuminate\Console\Command;

class RefreshGmailSubscription extends Command
{
    protected $signature = 'gmail:refresh';

    protected $description = 'Refresh Gmail pub/sub subscription.';

    public function handle()
    {
        try {
            (new GmailClient())->watch();
        } catch (\Exception $e) {
            $this->error($e->getMessage());
            return parent::FAILURE;
        }

        $this->info('Gmail subscription refreshed.');

        return parent::SUCCESS;
    }
}
