<?php

namespace Common\Core\Commands;

use Common\Admin\Sitemap\BaseSitemapGenerator;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate';

    public function handle()
    {
        $sitemap = class_exists('App\Core\SitemapGenerator')
            ? app('App\Core\SitemapGenerator')
            : app(BaseSitemapGenerator::class);
        $sitemap->generate();
        $this->info('Sitemap generated successfully');
    }
}
