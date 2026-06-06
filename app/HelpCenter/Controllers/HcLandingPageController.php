<?php namespace App\HelpCenter\Controllers;

use App\HelpCenter\Actions\HcLandingPageLoader;
use Common\Core\BaseController;

class HcLandingPageController extends BaseController
{
    public function __invoke()
    {
        $data = (new HcLandingPageLoader())->loadData([
            'categoryLimit' => settings('hcLanding.children_per_category', 6),
            'articleLimit' => settings('hcLanding.articles_per_category', 5),
            'loadArticles' =>
                settings('hcLanding.content.variant') === 'categoryGrid',
        ]);

        return $this->renderClientOrApi([
            'data' => $data,
            'pageName' => 'hc-landing-page',
        ]);
    }
}
