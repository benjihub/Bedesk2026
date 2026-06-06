<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Tags\Tag;
use Illuminate\Support\Arr;

class CrupdateArticle
{
    public function execute(
        array $data,
        HcArticle|null $originalArticle = null,
    ): HcArticle {
        $article = $originalArticle ?: new HcArticle();
        $originalData = $originalArticle ? $originalArticle->toArray() : [];

        $this->saveInlineProps($article, $originalData, $data);

        if (isset($data['sections'])) {
            $sections = HcCategory::select(['id', 'parent_id'])
                ->whereNotNull('parent_id')
                ->whereIn('id', $data['sections'])
                ->get();
            $ids = $sections->pluck('id')->merge($sections->pluck('parent_id'));
            $article->sections()->sync($ids);
        }

        if (array_key_exists('attachments', $data)) {
            $article->attachments()->sync($data['attachments']);
        }

        if (array_key_exists('tags', $data)) {
            $tags = app(Tag::class)->insertOrRetrieve($data['tags']);
            $article->tags()->sync($tags->pluck('id'));
        }

        if (isset($data['body']) && $article->body !== $data['body']) {
            (new SyncFileEntryModels())->fromHtml(
                $data['body'],
                $article->inlineImages(),
            );
        }

        return $article;
    }

    protected function saveInlineProps(
        HcArticle $article,
        array $originalData,
        array $data,
    ): void {
        $inlineProps = [
            'title',
            'body',
            'slug',
            'description',
            'draft',
            'author_id',
            'position',
            'visible_to_role',
            'managed_by_role',
        ];

        foreach ($inlineProps as $prop) {
            if (array_key_exists($prop, $data)) {
                $article->{$prop} = $data[$prop];
            }
        }

        if (!$article->title) {
            $article->title = __('Untitled');
        }

        if (!array_key_exists('used_by_ai_agent', $data)) {
            $article->used_by_ai_agent = true;
        }

        $this->maybeMarkForIngesting($article, $originalData);

        $article->save();
    }

    protected function maybeMarkForIngesting(
        HcArticle $article,
        array $originalData,
    ): void {
        if (!settings('aiAgent.enabled')) {
            return;
        }

        // if article is set from published to draft, detach all chunks
        if (!Arr::get($originalData, 'draft') && $article->draft) {
            $article->chunks()->delete();
            // else if body changed, or it's a new article and not draft, mark for ingestion
        } elseif (
            !$article->draft &&
            Arr::get($originalData, 'body') !== $article->body
        ) {
            $article->scan_pending = true;
        }
    }
}
