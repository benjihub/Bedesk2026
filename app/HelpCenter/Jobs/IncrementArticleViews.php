<?php

namespace App\HelpCenter\Jobs;

use App\HelpCenter\Models\HcArticle;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Session;

class IncrementArticleViews implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $articleId,
        public ?int $authUserId,
        public int $timestamp,
    ) {
    }

    public function handle()
    {
        HcArticle::where('id', $this->articleId)->increment('views');
    }

    public static function shouldIncrement(int $articleId): bool
    {
        if (!$articleId) {
            return false;
        }

        $views = Session::get('articleViews');

        // user has not viewed this article yet
        if (!$views || !isset($views[$articleId])) {
            return true;
        }

        // only log a view every 10 minutes from the same user
        $time = Carbon::createFromTimestamp($views[$articleId]);
        return Carbon::now()->diffInMinutes($time) > 10;
    }
}
