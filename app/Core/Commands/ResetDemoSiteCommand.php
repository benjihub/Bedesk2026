<?php

namespace App\Core\Commands;

use App\Demo\ResetDemoSite;
use Illuminate\Console\Command;

class ResetDemoSiteCommand extends Command
{
    protected $signature = 'demo:reset';
    protected $description = 'Reset demo site with sample data.';

    public function handle()
    {
        if (!config('app.demo')) {
            $this->warn('This is not a demo site! Aborting...');
            return;
        }

        (new ResetDemoSite())->execute();
    }
}
