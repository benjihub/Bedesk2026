<?php namespace Common\Database\Seeders;

use Common\Settings\Models\Setting;
use Exception;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UploadBackendsSeeder
{
    public function run()
    {
        $this->maybeEncryptUploadingSetting();
        $this->maybeCreateLocalBackends();
        $this->addBackendsToUploadTypes();
    }

    protected function maybeCreateLocalBackends()
    {
        $existing = Setting::where('name', 'uploading')->first()?->value ?? [];
        $hasLocal = Arr::first(
            $existing['backends'] ?? [],
            fn($backend) => $backend['type'] === 'local',
        );

        if (!$hasLocal) {
            $existing['backends'][] = [
                'id' => Str::random(10),
                'name' => 'Local',
                'type' => 'local',
            ];

            if (Setting::where('name', 'uploading')->exists()) {
                Setting::where('name', 'uploading')
                    ->first()
                    ->update([
                        'value' => $existing,
                    ]);
            } else {
                Setting::create([
                    'name' => 'uploading',
                    'value' => $existing,
                ]);
            }
        }
    }

    protected function addBackendsToUploadTypes()
    {
        $original = Setting::where('name', 'uploading')->first()->value;
        $uploadingSetting = $original;
        $localBackend = Arr::first(
            $uploadingSetting['backends'],
            fn($v) => $v['type'] === 'local',
        );

        $uploadTypes = config('filesystems.upload_types');
        foreach ($uploadTypes as $name => $config) {
            if (empty($uploadingSetting['types'][$name]['backends'])) {
                $uploadingSetting['types'][$name]['backends'][] =
                    $localBackend['id'];
            }

            if (
                Arr::get($config, 'defaults.max_file_size') &&
                !isset($uploadingSetting['types'][$name]['max_file_size'])
            ) {
                $uploadingSetting['types'][$name]['max_file_size'] = Arr::get(
                    $config,
                    'defaults.max_file_size',
                );
            }

            if (
                Arr::get($config, 'defaults.accept') &&
                !isset($uploadingSetting['types'][$name]['accept'])
            ) {
                $uploadingSetting['types'][$name]['accept'] = Arr::get(
                    $config,
                    'defaults.accept',
                );
            }
        }

        // only update if anything actually changed in the value
        if (json_encode($original) !== json_encode($uploadingSetting)) {
            Setting::where('name', 'uploading')
                ->first()
                ->update([
                    'value' => $uploadingSetting,
                ]);
        }
    }

    protected function maybeEncryptUploadingSetting()
    {
        $setting = DB::table('settings')->where('name', 'uploading')->first();
        if (!$setting) {
            return;
        }

        // if it's a valid json, it's not encrypted
        $isEncrypted = !json_decode($setting->value, true);

        if (!$isEncrypted) {
            DB::table('settings')
                ->where('name', 'uploading')
                ->update([
                    'value' => encrypt($setting->value),
                ]);
        }
    }
}
