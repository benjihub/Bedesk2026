<?php

namespace Livechat\Commands;

use Illuminate\Console\Command;
use App\Contacts\Models\PageVisit;

class MarkOldPageVisitsAsEnded extends Command
{
    protected $signature = 'app:mark-old-page-visits-as-ended';

    public function handle()
    {
        PageVisit::where('created_at', '<=', now()->subMinutes(5))
            ->where('ended_at', null)
            ->update([
                'ended_at' => now(),
            ]);
    }
}
