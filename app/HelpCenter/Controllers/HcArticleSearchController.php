<?php

namespace App\HelpCenter\Controllers;

use App\HelpCenter\Actions\SearchHcArticles;
use App\HelpCenter\Models\HcArticle;
use Common\Core\BaseController;

class HcArticleSearchController extends BaseController
{
    public function __invoke()
    {
        $this->authorize('index', HcArticle::class);

        $params = request()->all();
        if (!isset($params['query'])) {
            $params['query'] = request()->route('query');
        }

        $data = (new SearchHcArticles())->execute($params);

        return $this->renderClientOrApi([
            'data' => $data,
            'pageName' => 'hc-search-page',
        ]);
    }
}
