<?php

namespace Common\Files\Actions;

use Common\Files\FileEntry;
use Common\Files\Uploads\Uploads;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class SyncFileEntryModels
{
    public function fromHtml(string $html, MorphToMany $relation)
    {
        $fileNames = $this->getFileNamesFromImagesInHtml($html);

        $entries = FileEntry::whereIn('file_name', $fileNames)->get();

        $relation->sync($entries);
    }

    public function fromUrl(string $url, MorphToMany $relation)
    {
        if (!$this->isUrlForUploadedImage($url)) {
            return;
        }

        $entry = FileEntry::where(
            'file_name',
            $this->fileNameFromUrl($url),
        )->first();

        if ($entry) {
            $relation->sync($entry);
        }
    }

    public function fromArray(array $array, MorphToMany $relation)
    {
        $fileNames = $this->extractFileNamesFromArray($array);

        if (!empty($fileNames)) {
            $entries = FileEntry::whereIn('file_name', $fileNames)->get();
            $relation->sync($entries);
        }
    }

    public function fromEntryIds(array $entryIds, MorphToMany $relation)
    {
        $relation->sync($entryIds);
    }

    public function entryFileNameFromUrl(string $url): ?string
    {
        if ($this->isUrlForUploadedImage($url)) {
            return $this->fileNameFromUrl($url);
        }

        return null;
    }

    public function entryFileNameFromString($string): ?string
    {
        if (!is_string($string) || strlen($string) < 4) {
            return null;
        }

        // background image selector support
        if (Str::contains($string, 'url(')) {
            $string = preg_match('/url\((.*?)\)/', $string, $matches)
                ? $matches[1]
                : null;
        }

        if ($this->isStringAnUrlForUploadedImage($string)) {
            return $this->fileNameFromUrl($string);
        }

        return null;
    }

    public function extractFileNamesFromArray(
        array $array,
        array &$fileNames = [],
    ) {
        foreach ($array as $value) {
            if (is_array($value)) {
                $this->extractFileNamesFromArray($value, $fileNames);
            } else {
                if ($filename = $this->entryFileNameFromString($value)) {
                    $fileNames[] = $filename;
                }
            }
        }

        return $fileNames;
    }

    public function getFileNamesFromImagesInHtml(string $html): array
    {
        $fileNames = [];
        $crawler = new Crawler($html);

        $crawler
            ->filter('img[src]')
            ->each(function (Crawler $img) use (&$fileNames) {
                $url = $img->attr('src');
                if ($this->isUrlForUploadedImage($url)) {
                    $fileNames[] = $this->fileNameFromUrl($url);
                }
            });

        return $fileNames;
    }

    protected function fileNameFromUrl(string $url): string
    {
        return basename(parse_url($url)['path']);
    }

    public function isStringAnUrlForUploadedImage(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH);
        $pathInfo = pathinfo($path);
        $dir = Arr::get($pathInfo, 'dirname');
        $extension = Arr::get($pathInfo, 'extension');
        $filename = Arr::get($pathInfo, 'filename');

        if ($dir && $dir !== '.' && $extension && $filename) {
            return $this->isUrlForUploadedImage($url);
        }

        return false;
    }

    public function isUrlForUploadedImage(string $url)
    {
        // is relative
        if (Str::startsWith($url, '/') || !Str::startsWith($url, 'http')) {
            return true;
        }

        // is using app domain
        if (Str::startsWith($url, config('app.url'))) {
            return true;
        }

        // is using configured CDN
        foreach (Uploads::getAllBackends() as $backend) {
            if (
                $backend->customDomain &&
                Str::startsWith($url, $backend->customDomain)
            ) {
                return true;
            }
        }

        return false;
    }
}
