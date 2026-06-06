<?php

namespace App\HelpCenter\Controllers;

use App\HelpCenter\Actions\AggregateSearchTerms;
use App\HelpCenter\Models\SearchTerm;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class SearchTermController extends BaseController
{
    public function storeSearchSession()
    {
        if (Auth::user()?->isAgent() && config('app.env') === 'production') {
            return $this->success();
        }

        if (request()->has('searchSession')) {
            $sessionData = request('searchSession');
            // data might be sent via beacon API, need get it from raw post data
        } else {
            $sessionData = json_decode(request()->getContent(), true)[
                'searchSession'
            ];
        }

        (new AggregateSearchTerms())
            ->execute($sessionData)
            ->each(function ($item) {
                SearchTerm::create([
                    'term' => $item['term'],
                    'normalized_term' => $item['normalized_term'] ?? null,
                    'result_count' => count($item['results']),
                    'clicked_article' => (bool) $item['clickedArticle'],
                    'created_ticket' => (bool) $item['createdTicket'],
                    'category_id' => $item['categoryId'] ?? null,
                    'user_id' => Auth::id(),
                    'ip' => ip2long(getIp()),
                ]);
            });

        return $this->success();
    }
}
