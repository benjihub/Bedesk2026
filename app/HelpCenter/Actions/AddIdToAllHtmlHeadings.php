<?php

namespace App\HelpCenter\Actions;

class AddIdToAllHtmlHeadings
{
    public function execute($html)
    {
        return preg_replace_callback(
            '/<h([1-6])(?:.*?id="(.*?)")?.*?>(.*?)<\/h[1-6]>/i',
            function ($matches) {
                $headingLevel = $matches[1];
                $id = $matches[2] ?? null;
                $content = $matches[3];

                // If id is not set, generate it from the content
                if (!$id) {
                    $id = slugify(strip_tags($content));
                }

                return "<h{$headingLevel} id=\"{$id}\">{$content}</h{$headingLevel}>";
            },
            $html,
        );
    }
}
