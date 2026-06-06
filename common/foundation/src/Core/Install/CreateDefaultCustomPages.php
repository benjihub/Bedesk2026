<?php

namespace Common\Core\Install;

use Common\Pages\CustomPage;

class CreateDefaultCustomPages
{
    public function execute(): void
    {
        if (CustomPage::count() > 0) {
            return;
        }

        CustomPage::firstOrCreate(
            [
                'slug' => 'privacy-policy',
            ],
            [
                'title' => 'Example Privacy Policy',
                'slug' => 'privacy-policy',
                'body' => $this->replacePlaceholders(
                    file_get_contents(
                        app('path.common') .
                            '/resources/defaults/privacy-policy.html',
                    ),
                ),
                'type' => 'default',
            ],
        );

        CustomPage::firstOrCreate(
            [
                'slug' => 'terms-of-service',
            ],
            [
                'title' => 'Example Terms of Service',
                'slug' => 'terms-of-service',
                'body' => $this->replacePlaceholders(
                    file_get_contents(
                        app('path.common') .
                            '/resources/defaults/terms-of-service.html',
                    ),
                ),
                'type' => 'default',
            ],
        );

        CustomPage::firstOrCreate(
            [
                'slug' => 'about-us',
            ],
            [
                'title' => 'Example About Us',
                'slug' => 'about-us',
                'body' => file_get_contents(
                    app('path.common') . '/resources/defaults/lorem.html',
                ),
                'type' => 'default',
            ],
        );
    }

    protected function replacePlaceholders(string $text): string
    {
        return str_replace(
            [
                '[Website Name]',
                '[Website URL]',
                '[Contact Email]',
                '[Your Country/State]',
            ],
            [
                config('app.name'),
                url('/'),
                settings('mail.contact_page_address'),
                'United States',
            ],
            $text,
        );
    }
}
