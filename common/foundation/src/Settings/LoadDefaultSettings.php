<?php

namespace Common\Settings;

class LoadDefaultSettings
{
    static array|null $mergedSettings = null;

    public function execute(): array
    {
        if (static::$mergedSettings == null) {
            $commonSettings = require app('path.common') .
                '/resources/defaults/default-settings.php';
            $appPath = resource_path('defaults/default-settings.php');
            $appSettings = file_exists($appPath) ? require $appPath : [];
            static::$mergedSettings = $this->deepMergeDefaultSettings(
                $commonSettings,
                $appSettings,
            );
        }

        return static::$mergedSettings;
    }

    protected function deepMergeDefaultSettings(
        array $commonSettings,
        array $appSettings,
    ): array {
        foreach ($appSettings as $appSetting) {
            //remove default setting, if it's overwritten by user setting
            foreach ($commonSettings as $key => $commonSetting) {
                if ($commonSetting['name'] === $appSetting['name']) {
                    unset($commonSettings[$key]);
                }
            }

            //push user setting into default settings array
            $commonSettings[] = $appSetting;
        }

        return $commonSettings;
    }
}
