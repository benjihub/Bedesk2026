<?php namespace App\Core;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Admin\Sitemap\BaseSitemapGenerator;
use Common\Core\Contracts\AppUrlGenerator;
use Illuminate\Database\Eloquent\Model;

class SitemapGenerator extends BaseSitemapGenerator
{
    protected function getAppQueries(): array
    {
        return [
            HcArticle::where('draft', false)->select(['id', 'title']),
            HcCategory::select(['id', 'name']),
        ];
    }

    protected function getModelUrl(Model $model): string
    {
        $urls = app(AppUrlGenerator::class);

        if ($model instanceof HcArticle) {
            return $urls->article($model);
        }

        if ($model instanceof HcCategory) {
            return $urls->category($model);
        }

        return parent::getModelUrl($model);
    }

    protected function getAppStaticUrls(): array
    {
        return ['hc'];
    }
}
