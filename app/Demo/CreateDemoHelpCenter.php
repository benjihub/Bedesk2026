<?php

namespace App\Demo;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CreateDemoHelpCenter
{
    private array $demoCategories;

    public function __construct()
    {
        $this->demoCategories = json_decode(
            File::get(resource_path('demo/demo-categories.json')),
            true,
        );
    }

    public function execute(): void
    {
        $parents = $this->createParentCategories();
        $children = $this->createChildCategories($parents);
        $articleIds = $this->seedArticles();
        $this->attachArticlesToCategories($children, $articleIds);
        $this->createArticleFeedback($articleIds->values());
    }

    protected function createParentCategories(): Collection
    {
        HcCategory::insert(
            collect($this->demoCategories['parents'])
                ->map(
                    fn($name) => [
                        'name' => $name,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                )
                ->toArray(),
        );

        return HcCategory::whereIn(
            'name',
            $this->demoCategories['parents'],
        )->get();
    }

    protected function createChildCategories(Collection $parents): Collection
    {
        $children = $parents
            ->map(function (HcCategory $parent) {
                return collect($this->demoCategories['children'])->map(
                    fn($name) => [
                        'name' => $name,
                        'parent_id' => $parent->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            })
            ->flatten(1)
            ->toArray();

        HcCategory::insert($children);

        return HcCategory::whereIn(
            'name',
            $this->demoCategories['children'],
        )->get();
    }

    protected function seedArticles(): Collection
    {
        $articleNames = collect($this->demoCategories['articles'])->flatten(1);

        $articles = $articleNames
            ->map(
                fn($name) => [
                    'title' => $name,
                    'body' => File::get(
                        resource_path('demo/demo-article-body.html'),
                    ),
                    'author_id' => User::findAdmin()->id,
                    'slug' => slugify($name),
                    'created_at' => now(),
                    'updated_at' => now(),
                    'views' => rand(30, 400),
                ],
            )
            ->toArray();

        HcArticle::insert($articles);

        return HcArticle::whereIn('title', $articleNames)
            ->get()
            ->pluck('id', 'title');
    }

    protected function attachArticlesToCategories(
        Collection $children,
        Collection $articleIds,
    ): void {
        $index = 0;
        $allPivots = [];

        foreach ($children as $child) {
            $pivots = collect($this->demoCategories['articles'][$index])
                ->map(function ($articles) use ($child, $articleIds) {
                    return collect($articles)->map(
                        fn($name, $articleIndex) => [
                            'article_id' => $articleIds[$name],
                            'category_id' => $child->id,
                            'position' => $articleIndex,
                        ],
                    );
                })
                ->flatten(1)
                ->toArray();

            foreach ($pivots as $pivot) {
                $newPivot = [
                    'article_id' => $pivot['article_id'],
                    'category_id' => $child->parent_id,
                    'position' => $pivot['position'],
                ];
                $exists = Arr::first($allPivots, function ($p) use ($newPivot) {
                    return $p['article_id'] === $newPivot['article_id'] &&
                        $p['category_id'] === $newPivot['category_id'];
                });
                if ($exists) {
                    continue;
                }
                $pivots[] = $newPivot;
            }

            $allPivots = array_merge($allPivots, $pivots);

            $index++;

            //reset index to back to zero once it reaches 6
            //because there are only 5 6 article categories
            if ($index === 6) {
                $index = 0;
            }
        }

        DB::table('category_article')->insert($allPivots);
    }

    protected function createArticleFeedback(Collection $articleIds): void
    {
        $data = [];

        foreach ($articleIds as $key => $articleId) {
            $count = rand(10, 100);
            for ($i = 0; $i < $count; $i++) {
                $date = now()->subDays(rand(0, 5));
                $data[] = [
                    'article_id' => $articleId,
                    'was_helpful' => rand(0, 1),
                    'user_id' => $key + 1 + $i,
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }
        }

        DB::table('article_feedback')->insert($data);
    }
}
