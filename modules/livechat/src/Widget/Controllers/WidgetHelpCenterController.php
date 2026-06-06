<?php

namespace Livechat\Widget\Controllers;

use App\HelpCenter\Actions\HcLandingPageLoader;
use App\HelpCenter\Models\HcArticle;
use Common\Core\BaseController;
use App\Core\WidgetFlags;

class WidgetHelpCenterController extends BaseController
{
    public function helpCenterData()
    {
        $data = (new HcLandingPageLoader())->loadData([
            'categoryLimit' => 30,
            'articleLimit' => 50,
            'categoryId' => WidgetFlags::scopedHcCategoryId(),
        ]);

        return $this->success($data);
    }

    public function homeArticleList()
    {
        $categoryId = WidgetFlags::scopedHcCategoryId();
        $articles = HcArticle::query()
            ->take(4)
            ->orderBy('views', 'desc')
            ->when(
                $categoryId,
                fn($query) => $query
                    ->join(
                        'category_article',
                        'category_article.article_id',
                        'articles.id',
                    )
                    ->where('category_article.category_id', $categoryId),
            )
            ->get()
            ->loadPath()
            ->map(
                fn(HcArticle $article) => [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'path' => $article->path,
                ],
            );

        return response()->json([
            'articles' => $articles,
        ]);
    }
}
