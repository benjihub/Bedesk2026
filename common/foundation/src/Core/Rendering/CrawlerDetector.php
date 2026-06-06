<?php

namespace Common\Core\Rendering;

use Jaybizzle\CrawlerDetect\CrawlerDetect;

class CrawlerDetector
{
    protected bool|null $isCrawler = null;

    public function isCrawler(): bool
    {
        if ($this->isCrawler !== null) {
            return $this->isCrawler;
        }

        return $this->isCrawler =
            request()->isMethod('GET') &&
            (request()->query->has('_escaped_fragment_') ||
                request()->server->get('X-BUFFERBOT') ||
                (new CrawlerDetect())->isCrawler());
    }
}
