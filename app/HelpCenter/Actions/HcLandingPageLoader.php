<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HcLandingPageLoader
{
    public function loadData(array $options): array
    {
        return [
            'categories' => $this->loadLandingPageCategories($options),
            'articles' => $this->loadLandingPageArticles($options),
            'loader' => 'hcLandingPage',
        ];
    }

    protected function loadLandingPageCategories(array $options)
    {
        $categoryId = $options['categoryId'] ?? null;
        $categories = HcCategory::query()
            ->rootOnly()
            ->when($categoryId, fn($query) => $query->where('id', $categoryId))
            ->orderByPosition()
            ->filterByVisibleToRole()
            ->limit(10)
            ->withCount('sections')
            ->with([
                'sections' => function (HasMany $query) {
                    $query
                        ->withCount('articles')
                        ->filterByVisibleToRole()
                        ->with([
                            'articles' => function ($query) {
                                $query->filterByVisibleToRole();
                            },
                        ]);
                },
            ])
            ->get();

        $categoryLimit = $options['categoryLimit'] ?? null;
        $articleLimit = $options['articleLimit'] ?? null;

        return $categories->map(
            fn(HcCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'image' => $category->image,
                'description' => $category->description,
                'hide_from_structure' =>
                    $category->hide_from_structure ||
                    $categoryId === $category->id,
                'sections' => $category->sections
                    ->take(
                        $categoryLimit
                            ? $categoryLimit
                            : $category->sections->count(),
                    )
                    ->map(
                        fn(HcCategory $section) => [
                            'id' => $section->id,
                            'name' => $section->name,
                            'image' => $section->image,
                            'parent_id' => $section->parent_id,
                            'description' => $section->description,
                            'is_section' => true,
                            'hide_from_structure' =>
                                $section->hide_from_structure,
                            'articles_count' => $section->articles_count,
                            'articles' => $section->articles
                                ->take(
                                    $articleLimit
                                        ? $articleLimit
                                        : $section->articles->count(),
                                )
                                ->map(
                                    fn(HcArticle $article) => [
                                        'id' => $article->id,
                                        'title' => $article->title,
                                        'description' => $article->description,
                                    ],
                                ),
                        ],
                    ),
            ],
        );
    }

    protected function loadLandingPageArticles(array $options)
    {
        if (!Arr::get($options, 'loadArticles')) {
            return [];
        }

        return HcArticle::query()
            ->filterByVisibleToRole()
            ->orderBy('views', 'desc')
            ->where('draft', false)
            ->limit(10)
            ->get([
                'id',
                'title',
                'description',
                DB::raw('SUBSTRING(body, 1, 200) as body'),
            ])
            ->loadPath()
            ->map(
                fn(HcArticle $article) => [
                    'id' => $article->id,
                    'title' => $article->title,
                    'path' => $article->path,
                    'body' => $article->description
                        ? $article->description
                        : Str::limit(strip_tags($article->body), 120),
                ],
            );
    }
}
