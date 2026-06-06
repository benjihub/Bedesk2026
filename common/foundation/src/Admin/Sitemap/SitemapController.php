<?php

namespace Common\Admin\Sitemap;

use Common\Core\BaseController;
use Illuminate\Http\JsonResponse;

class SitemapController extends BaseController
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function generate(): JsonResponse
    {
        $this->blockOnDemoSite();

        $sitemap = app(BaseSitemapGenerator::class);

        if (class_exists('App\Core\SitemapGenerator')) {
            $sitemap = app('App\Core\SitemapGenerator');
        } elseif (class_exists('App\Services\SitemapGenerator')) {
            $sitemap = app('App\Services\SitemapGenerator');
        }

        $sitemap->generate();
        return $this->success([]);
    }
}
