<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\FileEntry;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;
use ZipArchive;

class HcImagesExporter
{
    protected SyncFileEntryModels $syncer;

    public function __construct()
    {
        $this->syncer = new SyncFileEntryModels();
    }

    public function article(ZipArchive $zip, HcArticle $article)
    {
        $fileNames = [];
        if ($article->body) {
            $fileNames = $this->syncer->getFileNamesFromImagesInHtml(
                $article->body,
            );
            if (!empty($fileNames)) {
                $entriesData = $this->addImagesToZip($fileNames, $zip);

                if (!empty($entriesData)) {
                    $zipEntries = $this->getZipEntries($zip);
                    $zipEntries['article_entries'][$article->id] = Arr::pluck(
                        $entriesData,
                        'id',
                    );
                    $zip->addFromString(
                        'file-entries.json',
                        json_encode($zipEntries),
                    );
                }
            }
        }
    }

    public function category(ZipArchive $zip, HcCategory $category)
    {
        if ($category->image) {
            $fileName = $this->syncer->entryFileNameFromString(
                $category->image,
            );

            if ($fileName) {
                $entriesData = $this->addImagesToZip([$fileName], $zip);

                if (!empty($entriesData)) {
                    $zipEntries = $this->getZipEntries($zip);
                    $zipEntries['category_entries'][$category->id] = Arr::pluck(
                        $entriesData,
                        'id',
                    );

                    $zip->addFromString(
                        'file-entries.json',
                        json_encode($zipEntries),
                    );
                }
            }
        }
    }

    protected function addImagesToZip(array $fileNames, ZipArchive $zip): array
    {
        $entries = FileEntry::whereIn('file_name', $fileNames)->get();
        $entriesData = [];

        $entries->each(function (FileEntry $entry) use ($zip, &$entriesData) {
            $path = trim($entry->getStoragePath(), '/');
            $contents = $entry->getDisk()->get($path);
            $zip->addFromString(trim("images/$path", '/'), $contents);
            $entriesData[] = $entry->toArray();
        });

        if (!empty($entriesData)) {
            $zipEntries = $this->getZipEntries($zip);
            $zipEntries['entries'] = array_merge(
                $zipEntries['entries'],
                $entriesData,
            );
            $zip->addFromString('file-entries.json', json_encode($zipEntries));
        }

        return $entriesData;
    }

    protected function getZipEntries(ZipArchive $zip)
    {
        $zipEntries = $zip->getFromName('file-entries.json');
        return $zipEntries
            ? json_decode($zipEntries, true)
            : [
                'entries' => [],
                'article_entries' => [],
                'category_entries' => [],
            ];
    }
}
