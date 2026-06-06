<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Files\Actions\StoreFile;
use Common\Files\FileEntry;
use Common\Files\FileEntryPayload;
use Common\Files\Uploads\Uploads;
use Common\Search\ImportRecordsIntoScout;
use Common\Tags\Tag;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class ImportHelpCenter
{
    public function execute(string $path): void
    {
        $zip = new ZipArchive();
        $zip->open($path);

        $files = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $files[] = $stat;
        }

        $helpCenter = json_decode($zip->getFromName('help-center.json'), true);

        // delete old help center data and truncate tables
        (new DeleteMultipleArticles())->execute(
            DB::table('articles')->pluck('id')->toArray(),
        );
        DB::table('articles')->truncate();
        DB::table('categories')->truncate();
        DB::table('category_article')->truncate();

        HcArticle::disableSearchSyncing();

        try {
            Artisan::call('scout:flush ' . HcArticle::class);
        } catch (\Exception) {
        }

        // unguard models (we will restore article/category model ids from json)
        HcCategory::unguard();
        HcArticle::unguard();
        Tag::unguard();
        FileEntry::unguard();

        foreach ($helpCenter as $categoryData) {
            // create categories
            $category = HcCategory::create([
                ...Arr::except($categoryData, [
                    'sections',
                    'model_type',
                    'is_section',
                    'hidden',
                ]),
                'created_at' => $categoryData['created_at'] ?? now(),
                'updated_at' => $categoryData['updated_at'] ?? now(),
            ]);

            // create sections
            collect($categoryData['sections'])->each(function (
                $sectionData,
            ) use ($category) {
                $sectionData['parent_id'] = $category->id;
                $section = HcCategory::create([
                    ...Arr::except($sectionData, [
                        'articles',
                        'model_type',
                        'is_section',
                        'hidden',
                    ]),
                    'created_at' => $sectionData['created_at'] ?? now(),
                    'updated_at' => $sectionData['updated_at'] ?? now(),
                ]);

                // create articles
                foreach ($sectionData['articles'] as $articleData) {
                    $article = HcArticle::firstOrCreate([
                        ...Arr::except($articleData, [
                            'tags',
                            'model_type',
                            'article_id',
                            'category_id',
                            'position',
                            'extra_data',
                        ]),
                        'created_at' => $articleData['created_at'] ?? now(),
                        'updated_at' => $articleData['updated_at'] ?? now(),
                        'author_id' => Arr::get($articleData, 'author_id')
                            ? $articleData['author_id']
                            : Auth::id(),
                    ]);
                    $article
                        ->categories()
                        ->syncWithoutDetaching([$section->id, $category->id]);

                    // create tags
                    foreach ($articleData['tags'] as $tagData) {
                        $attrs = [
                            'name' => $tagData['name'],
                        ];
                        $tag = Tag::where('name', $tagData['name'])->first();
                        if (!$tag) {
                            $tag = Tag::create($attrs);
                        }

                        try {
                            $article->tags()->attach($tag->id);
                        } catch (\Exception) {
                        }
                    }
                }
            });
        }

        $this->storeHcImages($zip);

        Cache::flush();
        (new ImportRecordsIntoScout())->execute(HcArticle::class);
        $zip->close();
    }

    protected function storeHcImages(ZipArchive $zip)
    {
        $fileEntries = json_decode(
            $zip->getFromName('file-entries.json'),
            true,
        );

        foreach ($fileEntries['article_entries'] as $articleId => $entryIds) {
            foreach ($entryIds as $entryId) {
                $entryData = is_array($entryId)
                    ? $entryId
                    : Arr::first(
                        $fileEntries['entries'],
                        fn($entry) => $entry['id'] === $entryId,
                    );
                $fileEntry = FileEntry::firstOrCreate(
                    ['file_name' => $entryData['file_name']],
                    Arr::except($entryData, ['id', 'url', 'hash']),
                );
                $article = HcArticle::find($articleId);
                $article->inlineImages()->attach($fileEntry->id);

                $fileEntry
                    ->getDisk()
                    ->put(
                        $fileEntry->getStoragePath(),
                        $zip->getFromName('images/' . $fileEntry->file_name),
                    );
            }
        }

        foreach ($fileEntries['category_entries'] as $categoryId => $entryIds) {
            foreach ($entryIds as $entryId) {
                $entryData = is_array($entryId)
                    ? $entryId
                    : Arr::first(
                        $fileEntries['entries'],
                        fn($entry) => $entry['id'] === $entryId,
                    );
                $fileEntry = FileEntry::firstOrCreate(
                    ['file_name' => $entryData['file_name']],
                    Arr::except($entryData, ['id', 'url', 'hash']),
                );
                $category = HcCategory::find($categoryId);
                $category->images()->attach($fileEntry->id);
                $fileEntry
                    ->getDisk()
                    ->put(
                        $fileEntry->getStoragePath(),
                        $zip->getFromName('images/' . $fileEntry->file_name),
                    );
            }
        }
    }
}
