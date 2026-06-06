<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\ArticleCollection;
use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Files\FileEntry;
use Common\Tags\Tag;
use Illuminate\Support\Collection;

class HcArticleLoader
{
    public function loadData(?string $loader): array
    {
        $articleId = request()->route('articleId');

        if (!$loader) {
            $loader = 'articlePage';
        }

        if (
            $articleId === 'f7fy8bxf0e18' &&
            (request()->header('X-Settings-Preview') === 'true' ||
                request('settingsPreview') === 'true')
        ) {
            return $this->loadPreviewArticle();
        }

        // make sure it's a valid category id. It can be null or number, but not "null" as string
        $categoryId = request()->route('categoryId');
        if ($categoryId && !ctype_digit($categoryId)) {
            abort(404);
        }

        $article = HcArticle::findOrFail($articleId);
        $article = (new ArticleCollection([$article]))
            ->loadPath(
                request()->route('categoryId'),
                request()->route('sectionId'),
            )
            ->first();

        if ($loader === 'updateArticle') {
            return $this->loadArticleForUpdatePage($article);
        }

        return $this->loadArticlePage(
            $article,
            $article->path[0]['id'] ?? null,
        );
    }

    protected function loadArticlePage(
        HcArticle $article,
        int|null $categoryId = null,
    ): array {
        $article->load('attachments');

        $pageNav = (new GenerateArticleContentNav())->execute($article);

        $body = $article->body;

        // prefix help center urls with full path in article body
        if ($article->path->count() > 1) {
            $category = $article->path[0]['id'];
            $section = $article->path[1]['id'];

            $body = preg_replace(
                '/"hc\/articles\/([0-9]+)\/([a-z0-9\-]+)"/',
                "hc/articles/$category/$section/$1/$2",
                $body,
            );
        }

        return [
            'article' => [
                'id' => $article->id,
                'draft' => $article->draft,
                'path' => $article->path,
                'title' => $article->title,
                'body' => $body,
                'managed_by_role' => $article->managed_by_role,
                'created_at' => $article->created_at,
                'updated_at' => $article->updated_at,
                'description' => $article->description,
                'attachments' => $article->attachments->map(
                    fn(FileEntry $entry) => [
                        'id' => $entry->id,
                        'name' => $entry->name,
                        'file_size' => $entry->file_size,
                        'hash' => $entry->hash,
                    ],
                ),
            ],
            'categoryNav' => $categoryId
                ? $this->loadCategoryNav($categoryId)
                : collect([]),
            'pageNav' => $pageNav,
            'loader' => 'articlePage',
        ];
    }

    protected function loadArticleForUpdatePage(HcArticle $article): array
    {
        $article = $article->load([
            'sections',
            'tags',
            'attachments',
            'author',
        ]);

        return [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'visible_to_role' => $article->visible_to_role,
                'author_id' => $article->author_id,
                'managed_by_role' => $article->managed_by_role,
                'draft' => $article->draft,
                'body' => $article->body,
                'sections' => $article->sections->map(
                    fn(HcCategory $section) => [
                        'id' => $section->id,
                        'name' => $section->name,
                        'parent_id' => $section->parent_id,
                    ],
                ),
                'tags' => $article->tags->map(
                    fn(Tag $tag) => [
                        'id' => $tag->id,
                        'name' => $tag->name,
                    ],
                ),
                'attachments' => $article->attachments->map(
                    fn(FileEntry $entry) => [
                        'id' => $entry->id,
                        'name' => $entry->name,
                        'file_size' => $entry->file_size,
                        'hash' => $entry->hash,
                    ],
                ),
            ],
            'loader' => 'updateArticle',
        ];
    }

    public function loadCategoryNav(int $categoryId): Collection
    {
        return HcCategory::where('parent_id', $categoryId)
            ->filterByVisibleToRole()
            ->orderByPosition()
            ->with([
                'articles' => fn($q) => $q->filterByVisibleToRole(),
            ])
            ->limit(20)
            ->get()
            ->map(
                fn(HcCategory $section) => [
                    'id' => $section->id,
                    'name' => $section->name,
                    'parent_id' => $section->parent_id,
                    'articles' => $section->articles->map(
                        fn(HcArticle $article) => [
                            'id' => $article->id,
                            'title' => $article->title,
                            'slug' => $article->slug,
                        ],
                    ),
                ],
            );
    }

    protected function loadPreviewArticle(): array
    {
        $body = file_get_contents(resource_path('demo/demo-article-body.html'));

        $article = [
            'id' => -1,
            'path' => [
                [
                    'id' => -2,
                    'name' => 'Preview category',
                    'parent_id' => null,
                ],
                [
                    'id' => -3,
                    'name' => 'Preview section',
                    'parent_id' => -2,
                ],
            ],
            'title' => 'Preview article',
            'body' => $body,
            'description' => 'Preview article description',
            'created_at' => now(),
            'updated_at' => now(),
            'attachments' => [],
        ];

        $data = json_decode(
            file_get_contents(resource_path('demo/demo-categories.json')),
            true,
        );

        $categoryNav = collect($data['children'])->map(
            fn(string $section, $index) => [
                'id' => $section,
                'name' => $section,
                'parent_id' => $index - 10,
                'articles' => collect($data['articles'][$index])->map(
                    fn(string $article) => [
                        'id' => $article,
                        'title' => $article,
                        'slug' => $article,
                    ],
                ),
            ],
        );

        return [
            'article' => $article,
            'categoryNav' => $categoryNav,
            'pageNav' => (new GenerateArticleContentNav())->execute($article),
            'loader' => 'previewArticle',
        ];
    }
}
