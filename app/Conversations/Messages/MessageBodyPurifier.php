<?php namespace App\Conversations\Messages;

use HTMLPurifier;
use HTMLPurifier_Config;

class MessageBodyPurifier
{
    public const REPLY_ABOVE_ID = 'bedeskReplyAboveThisLine';

    /**
     * Body from message submitted via widget or website
     */
    public function messageBody(string $htmlBody): string
    {
        $containsHtml = $htmlBody !== strip_tags($htmlBody);

        // don't do anything if provided body has no html,
        // otherwise purifying might add unnecessary <p> tags
        if ($containsHtml) {
            $htmlBody = $this->purifyContent($htmlBody);
        }

        return $htmlBody;
    }

    /**
     * Body from html email
     */
    public function emailBody(string $htmlBody): string
    {
        $htmlBody = html_entity_decode($htmlBody);

        // remove reference if it got through
        $htmlBody = preg_replace(
            '/\|reference=[a-zA-Z0-9]{30}\|/',
            '',
            $htmlBody,
        );

        return $this->purifyContent($htmlBody);
    }

    protected function purifyContent(string $htmlBody): string
    {
        // without this empty <p> tags from tiptap will be removed and new lines will not work
        $html = preg_replace('/<p><\/p>/', '<p><br></p>', $htmlBody);

        return $this->getPurifier()->purify($html);
    }

    protected function getPurifier(): HTMLPurifier
    {
        $config = HTMLPurifier_Config::createDefault();

        $config->set('Core.Encoding', 'UTF-8');
        $config->set('HTML.Doctype', 'HTML 4.01 Transitional');
        $config->set('Cache.SerializerPath', storage_path('app/purifier'));
        $config->set(
            'HTML.Allowed',
            'div,blockquote,b,strong,i,u,strike,a[href],ul,ol,li,br,p,img[src|width|height],pre,code',
        );
        $config->set('HTML.TargetBlank', true);
        $config->set('AutoFormat.AutoParagraph', true);
        $config->set('AutoFormat.RemoveEmpty', true);
        $config->set('AutoFormat.RemoveEmpty.RemoveNbsp', true);

        return new HTMLPurifier($config);
    }
}
