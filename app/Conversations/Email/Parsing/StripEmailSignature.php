<?php

namespace App\Conversations\Email\Parsing;

use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class StripEmailSignature
{
    private ?Crawler $crawler = null;

    public function execute(string $htmlBody): string
    {
        try {
            $this->crawler = new Crawler($htmlBody);
        } catch (\Exception $e) {
            return $htmlBody;
        }

        collect(get_class_methods($this))
            ->filter(fn($methodName) => Str::startsWith($methodName, 'strip'))
            ->each(function ($methodName) {
                $this->$methodName();
            });

        $html = $this->crawler->count() ? $this->crawler->html() : $htmlBody;
        $html = str_replace(' Sent from my iPhone', '', $html);
        return $html;
    }

    private function stripAppleMail()
    {
        $match = $this->crawler->filter('#AppleMailSignature');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
        }
    }

    private function stripOutlookMobile()
    {
        $match = $this->crawler->filter('#ms-outlook-mobile-signature');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
        }
    }

    private function stripOpenExchange()
    {
        $match = $this->crawler->filter('.io-ox-signature');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
        }
    }

    private function stripGmail()
    {
        $match = $this->crawler->filter('.gmail_signature_prefix');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
        }

        $match = $this->crawler->filter('.gmail_signature');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
        }
    }
}
