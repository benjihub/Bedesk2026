<?php

namespace Common\Settings\Manager;

use Common\Settings\Themes\CssTheme;
use Common\Settings\DotEnvEditor;
use Common\Settings\Events\SettingsSaved;
use Common\Settings\GenerateFavicon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class StoreSettingsManagerData
{
    public function execute(array $data)
    {
        if (isset($data['server']) && !empty($data['server'])) {
            (new DotEnvEditor())->write($data['server']);
        }

        $this->saveDatabaseSettings($data);

        $this->saveCustomCode($data);

        $this->saveSeo($data);

        $this->saveThemes($data);

        Cache::flush();

        event(new SettingsSaved($data['client'], $data['server']));
    }

    protected function saveDatabaseSettings(array $data)
    {
        if (empty($data['client'])) {
            return;
        }

        // handle favicon, if it changed
        if (isset($data['client']['branding.favicon'])) {
            $path = $data['client']['branding.favicon'];
            unset($data['client']['branding.favicon']);
            (new GenerateFavicon())->execute($path);
        }

        // save the rest of db settings
        settings()->save($data['client']);
    }

    protected function saveCustomCode(array $data)
    {
        if (isset($data['custom_code']) && !empty($data['custom_code'])) {
            foreach ($data['custom_code'] as $key => $value) {
                $path =
                    $key === 'css'
                        ? LoadSettingsManagerData::CUSTOM_CSS_PATH
                        : LoadSettingsManagerData::CUSTOM_HTML_PATH;

                File::ensureDirectoryExists(public_path('storage/custom-code'));
                if (trim($value)) {
                    File::put(public_path("storage/$path"), trim($value));
                } else {
                    File::delete(public_path("storage/$path"));
                }
            }
        }
    }

    protected function saveSeo(array $data)
    {
        if (isset($data['seo']) && !empty($data['seo'])) {
            $directory = storage_path('app/editable-views/seo-tags');
            File::ensureDirectoryExists($directory);
            foreach ($data['seo'] as $fileName => $content) {
                file_put_contents("$directory/$fileName.blade.php", $content);
            }
        }
    }

    protected function saveThemes(array $data): void
    {
        if (!isset($data['themes']) || empty($data['themes'])) {
            return;
        }

        $newThemes = $data['themes'];
        $type = $newThemes[0]['type'];

        // make sure to not remove different type of themes
        $dbThemes = CssTheme::where('type', $type)->get();

        // delete themes that were removed in appearance editor
        $dbThemes->each(function (CssTheme $theme) use ($newThemes) {
            if (
                !Arr::first(
                    $newThemes,
                    fn($current) => $current['id'] == $theme['id'],
                )
            ) {
                $theme->delete();
            }
        });

        // update changed themes and create new ones
        foreach ($newThemes as $theme) {
            $existing = $dbThemes->find($theme['id']);
            $newValue = Arr::except($theme, ['id', 'updated_at']);
            if (!$existing) {
                CssTheme::create(
                    array_merge($newValue, ['user_id' => Auth::id()]),
                );
            } else {
                $existing->fill($newValue)->save();
            }
        }
    }
}
