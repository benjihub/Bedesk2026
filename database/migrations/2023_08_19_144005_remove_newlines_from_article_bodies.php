<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        foreach (DB::table('articles')->cursor() as $article) {
            // replace <pre> tags with placeholders
            $preTags = [];
            $placeholderIndex = 0;
            $htmlWithPlaceholders = preg_replace_callback(
                '/<pre>[\s\S]*?<\/pre>/',
                function ($matches) use (&$preTags, &$placeholderIndex) {
                    $placeholder = "##PRE_TAG_PLACEHOLDER_{$placeholderIndex}##";
                    $preTags[$placeholderIndex] = $matches[0];
                    $placeholderIndex++;
                    return $placeholder;
                },
                $article->body,
            );

            // remove newlines
            $htmlWithoutNewlines = str_replace("\n", '', $htmlWithPlaceholders);

            // replace placeholders with original <pre> tags
            $finalHtml = $htmlWithoutNewlines;
            foreach ($preTags as $index => $preTag) {
                $finalHtml = str_replace(
                    "##PRE_TAG_PLACEHOLDER_{$index}##",
                    $preTag,
                    $finalHtml,
                );
            }

            // update info widgets
            str_replace('widget widget-note', 'info-block', $finalHtml);
            str_replace(
                'widget widget-important',
                'info-block important',
                $finalHtml,
            );
            str_replace(
                'widget widget-warning',
                'info-block warning',
                $finalHtml,
            );

            // update typescript panels
            str_replace('tsd-panel', 'tsd-panel not-prose', $finalHtml);

            // remove links from heading tags
            $pattern = '/(<h[2-4](\sid="[^"]*")?>)(.*?)(<\/h[2-4]>)/is';
            $replacement = function ($matches) {
                $contentWithoutATags = preg_replace(
                    '/<a[^>]*>(.*?)<\/a>/is',
                    '$1',
                    $matches[3],
                );
                return $matches[1] . $contentWithoutATags . $matches[4];
            };
            $finalHtml = preg_replace_callback(
                $pattern,
                $replacement,
                $finalHtml,
            );

            DB::table('articles')
                ->where('id', $article->id)
                ->update([
                    'body' => $finalHtml,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
};
