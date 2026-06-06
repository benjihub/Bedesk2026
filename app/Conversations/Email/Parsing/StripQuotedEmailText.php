<?php

namespace App\Conversations\Email\Parsing;

use App\Conversations\Messages\MessageBodyPurifier;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class StripQuotedEmailText
{
    private ?Crawler $crawler = null;

    public function execute(string $htmlBody): string
    {
        $this->crawler = new Crawler($htmlBody);

        $stripMethods = array_filter(
            get_class_methods($this),
            fn($methodName) => Str::startsWith($methodName, 'strip'),
        );

        foreach ($stripMethods as $methodName) {
            $stripped = $this->$methodName();

            if ($stripped) {
                try {
                    $html = $this->crawler->outerHtml();
                    if ($html && Str::contains($html, '|reference=')) {
                        return $html;
                    }
                } catch (\Exception $e) {
                    //
                }
            }
        }

        // remove quoted content by "reply above ID" separator, if it was
        // not removed already via specific mail provider strip methods
        $separator = MessageBodyPurifier::REPLY_ABOVE_ID;
        if (Str::contains($this->crawler->outerHtml(), $separator)) {
            $matches = $this->crawler->filter('[id*="' . $separator . '"]');
            if ($matches->count()) {
                $matches->each(function (Crawler $match) {
                    $node = $match->getNode(0);
                    $node->parentNode->removeChild($node);
                });
            }
        }

        return $this->crawler->outerHtml();
    }

    private function stripGmail(): bool
    {
        $match = $this->crawler->filter('.gmail_quote');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
            return true;
        }
        return false;
    }

    private function stripAppleMail(): bool
    {
        // remove all html after "Sent from my iPhone", crawler
        // will correct invalid html due to missing tags

        // find blockquote, Apply mail puts quoted reply in this tag
        $match = $this->crawler->filter('blockquote');
        if ($match->count()) {
            $blockquoteNode = $match->getNode(0);
            // find previous node: On Oct 17, 2017, at 12:22 PM, Name email@email.com> wrote:
            $prevNode = $match->previousAll()->first();
            if (
                $prevNode->count() &&
                Str::endsWith($prevNode->text(), 'wrote:')
            ) {
                $node = $prevNode->getNode(0);
                $node->parentNode->removeChild($node);
                $blockquoteNode->parentNode->removeChild($blockquoteNode);
                return true;
            }
        }
        return false;
    }

    private function stripOutlook(): bool
    {
        // remove #divRplyFwdMsg and all nodes after it
        $match = $this->crawler->filter('#divRplyFwdMsg');
        if ($match->count()) {
            $match->nextAll()->each(function (Crawler $c) {
                $node = $c->getNode(0);
                $c->getNode(0)->parentNode->removeChild($node);
            });
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
            return true;
        }
        return false;
    }

    private function stripOutlook2(): bool
    {
        // remove all nodes after "[style=mso-bookmark:_MailEndCompose]"
        $match = $this->crawler->filter(
            '[style="mso-bookmark:_MailEndCompose"]',
        );
        if ($match->count()) {
            $match->nextAll()->each(function (Crawler $c) {
                $node = $c->getNode(0);
                $c->getNode(0)->parentNode->removeChild($node);
            });
            return true;
        }
        return false;
    }

    private function stripOutlook3(): bool
    {
        // remove all nodes after "[style=mso-bookmark:_MailEndCompose]"
        $match = $this->crawler->filter(
            '[style^="mso-element:para-border-div;border:none;border-top:solid #E1E1E1 1.0pt;padding:3.0pt"]',
        );
        if ($match->count() && Str::contains($match->html(), 'mailto:')) {
            $match->nextAll()->each(function (Crawler $c) {
                $node = $c->getNode(0);
                $c->getNode(0)->parentNode->removeChild($node);
            });
            return true;
        }
        return false;
    }

    private function stripYahoo(): bool
    {
        $match = $this->crawler->filter('[class$="yahoo_quoted"]');
        if ($match->count()) {
            $node = $match->getNode(0);
            $node->parentNode->removeChild($node);
            return true;
        }
        return false;
    }
}
