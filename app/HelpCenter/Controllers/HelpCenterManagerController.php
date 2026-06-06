<?php

namespace App\HelpCenter\Controllers;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Core\BaseController;
use Illuminate\Support\Facades\DB;

class HelpCenterManagerController extends BaseController
{
    public function categories(int|null $categoryId = null)
    {
        $this->authorize('update', HcArticle::class);

        $query = HcCategory::query()->withCount('articles');

        if (!is_null($categoryId)) {
            $query->where('parent_id', $categoryId);
        } else {
            $query->whereNull('parent_id')->withCount('sections');
        }

        $data = [
            'categories' => $query
                ->limit(50)
                ->orderBy('position', 'asc')
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'is_section' => $category->is_section,
                        'parent_id' => $category->parent_id,
                        'description' => $category->description,
                        'image' => $category->image,
                        'visible_to_role' => $category->visible_to_role,
                        'managed_by_role' => $category->managed_by_role,
                        'articles_count' => $category->articles_count,
                        'sections_count' => $category->sections_count,
                    ];
                }),
        ];

        if ($categoryId) {
            $category = HcCategory::find($categoryId);
            $data['category'] = [
                'id' => $category->id,
                'name' => $category->name,
            ];
        }

        return $this->success($data);
    }

    public function articles(int $sectionId)
    {
        $this->authorize('update', HcArticle::class);

        $section = HcCategory::findOrFail($sectionId);
        $category = HcCategory::findOrFail($section->parent_id);

        return $this->success([
            'articles' => HcArticle::query()
                ->join(
                    'category_article',
                    'articles.id',
                    'category_article.article_id',
                )
                ->where('category_article.category_id', $section->id)
                ->orderBy('category_article.position', 'asc')
                ->get()
                ->map(function ($article) {
                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'position' => $article->position,
                    ];
                }),
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
            ],
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
            ],
        ]);
    }

    public function reorderCategories()
    {
        $this->authorize('update', HcArticle::class);

        $data = $this->validate(request(), [
            'parentId' => 'integer|nullable',
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $queryPart = '';
        foreach ($data['ids'] as $position => $id) {
            $position++;
            $queryPart .= " when id=$id then $position";
        }

        HcCategory::query()
            ->where('parent_id', $data['parentId'] ?? null)
            ->update([
                'position' => DB::raw("(case $queryPart end)"),
            ]);

        return $this->success();
    }

    public function reorderArticles(int $sectionId)
    {
        $this->authorize('update', HcArticle::class);

        $data = $this->validate(request(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $queryPart = '';
        foreach ($data['ids'] as $position => $id) {
            $position++;
            $queryPart .= " when article_id=$id then $position";
        }

        DB::table('category_article')
            ->where('category_id', $sectionId)
            ->update([
                'position' => DB::raw("(case $queryPart end)"),
            ]);

        return $this->success();
    }
}
