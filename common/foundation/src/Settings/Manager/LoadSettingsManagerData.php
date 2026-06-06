<?php

namespace Common\Settings\Manager;

use Common\Settings\Themes\CssTheme;
use Common\Core\AppUrl;
use Common\Core\Values\ValueLists;
use Common\Files\Uploads\CountUploadingBackendFiles;
use Common\Settings\DotEnvEditor;
use Common\Settings\LoadDefaultSettings;
use Common\Settings\Mail\ConnectGmailAccountController;
use Common\Settings\Settings;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\View;

class LoadSettingsManagerData
{
    const CUSTOM_CSS_PATH = 'custom-code/custom-styles.css';
    const CUSTOM_HTML_PATH = 'custom-code/custom-html.html';

    public function execute()
    {
        return [
            'server' => $this->loadEnvSettings(),
            'client' => app(Settings::class)->getAllForFrontendForm(),
            'themes' => CssTheme::orderBy('created_at', 'asc')->get(),
            'custom_code' => $this->loadCustomCode(),
            'defaults' => $this->loadDefaults(),
            'modules' => config('modules'),
            'uploading' => [
                'file_counts' => Cache::get(
                    CountUploadingBackendFiles::CACHE_KEY,
                ),
                'types' => config('filesystems.upload_types'),
            ],
        ];
    }

    protected function loadEnvSettings(): array
    {
        $envSettings = (new DotEnvEditor())->load();
        $envSettings['newAppUrl'] = app(AppUrl::class)->newAppUrl;
        $envSettings[
            'connectedGmailAccount'
        ] = ConnectGmailAccountController::getConnectedEmail();

        // inputs on frontend can't be bound to null
        foreach ($envSettings as $key => $value) {
            if ($value === null) {
                $envSettings[$key] = '';
            }
        }

        return $envSettings;
    }

    protected function loadDefaults(): array
    {
        $defaults = [
            'themes' => config('themes'),
        ];

        $defaultSettings = collect((new LoadDefaultSettings())->execute())
            ->mapWithKeys(fn($item) => [$item['name'] => $item['value']])
            ->toArray();
        $defaults['client'] = settings()->getUnflattened(
            false,
            $defaultSettings,
        );

        return $defaults;
    }

    protected function loadCustomCode(): array
    {
        $customCode = [
            'css' => '',
            'html' => '',
        ];
        if (!config('app.demo')) {
            $customCode['css'] = @file_get_contents(
                public_path('storage/' . self::CUSTOM_CSS_PATH),
            );
            $customCode['html'] = @file_get_contents(
                public_path('storage/' . self::CUSTOM_HTML_PATH),
            );
        }

        return $customCode;
    }

    public function loadMenuEditorConfig()
    {
        $commonConfig = require app('path.common') .
            '/resources/defaults/menu-editor-config.php';
        $appConfig = require resource_path('defaults/menu-editor-config.php');

        $menuItemCategories = app(ValueLists::class)->menuItemCategories();

        return [
            'config' => array_merge_recursive($commonConfig, $appConfig),
            'categories' => $menuItemCategories,
        ];
    }

    public function loadSeoTags(): array
    {
        $response = [];
        $finder = View::getFinder();

        $names = [];
        foreach ($finder->getPaths() as $path) {
            if (file_exists("$path/seo")) {
                $names = array_merge(
                    $names,
                    array_map(
                        fn($dir) => basename($dir),
                        File::directories("$path/seo"),
                    ),
                );
            }
        }

        foreach ($names as $name) {
            try {
                $response[$name] = [
                    'custom' => View::exists("editable-views::seo-tags.$name")
                        ? file_get_contents(
                            $finder->find("editable-views::seo-tags.$name"),
                        )
                        : null,
                    'original' => file_get_contents(
                        $finder->find("seo.$name.seo-tags"),
                    ),
                ];
            } catch (Exception $e) {
                //
            }
        }

        return $response;
    }
}
