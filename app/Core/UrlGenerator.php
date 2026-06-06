<?php

namespace App\Core;

use App\Conversations\Models\Conversation;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Core\Prerender\BaseUrlGenerator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class UrlGenerator extends BaseUrlGenerator
{
    public function conversation(Conversation|array $conversation): string
    {
        $viewId =
            Arr::get($conversation, 'assignee_id') === Auth::id()
                ? 'mine'
                : 'all';
        return url(
            "dashboard/conversations/{$conversation['id']}?viewId={$viewId}",
        );
    }

    public function article(array|HcArticle $article): string
    {
        return url('hc/articles') .
            "/{$article['id']}/" .
            slugify($article['title']);
    }

    public function category(HcCategory|array $category): string
    {
        return url('hc/categories') .
            "/{$category['id']}/" .
            slugify($category['name']);
    }

    public function search(string|null $query = null): string
    {
        return url($query ? "hc/search/$query" : 'hc/search');
    }
}
