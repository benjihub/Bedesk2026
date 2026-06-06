<?php

use Common\Settings\DotEnvEditor;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    protected array $env;
    protected array $settings = [
        'chunk_size' => 2097152, // 2MB
        'backends' => [],
        'types' => [],
    ];

    public function up(): void
    {
        if (!DB::table('settings')->where('name', 'uploading')->exists()) {
            $this->env = (new DotEnvEditor())->load();

            $this->createLocalBackends();
            $this->maybeCreateFtpBackend();
            $this->maybeCreateS3Backend();
            $this->maybeCreateDigitalOceanBackend();
            $this->maybeCreateBackblazeBackend();
            $this->addBackendsToUploadTypes();

            DB::table('settings')->insert([
                'name' => 'uploading',
                'value' => json_encode($this->settings),
            ]);
        }
    }

    protected function addBackendsToUploadTypes()
    {
        $uploadTypes = config('filesystems.upload_types');
        $oldPublicDriver = $this->env['public_disk_driver'] ?? 'local';
        $oldPrivateDriver = $this->env['uploads_disk_driver'] ?? 'local';
        foreach ($uploadTypes as $name => $config) {
            $oldDriver =
                Arr::get($config, 'visibility') === 'public'
                    ? $oldPublicDriver
                    : $oldPrivateDriver;
            $backend =
                Arr::first(
                    $this->settings['backends'],
                    fn($v) => Str::startsWith($oldDriver, $v['type']),
                ) ?? $this->settings['backends'][0];

            $this->settings['types'][$name] = [
                'backends' => [$backend['id']],
            ];

            if ($maxFileSize = Arr::get($config, 'defaults.max_file_size')) {
                $this->settings['types'][$name]['max_file_size'] = $maxFileSize;
            }

            if ($accept = Arr::get($config, 'defaults.accept')) {
                $this->settings['types'][$name]['accept'] = $accept;
            }
        }
    }

    protected function createLocalBackends()
    {
        $this->settings['backends'][] = [
            'id' => Str::random(10),
            'name' => 'Local',
            'type' => 'local',
        ];
    }

    protected function maybeCreateFtpBackend()
    {
        $host = $this->getEnv('storage_ftp_host');
        $username = $this->getEnv('storage_ftp_username');
        $password = $this->getEnv('storage_ftp_password');
        if ($host && $username && $password) {
            $backend = [
                'id' => Str::random(10),
                'name' => 'FTP',
                'type' => 'ftp',
                'config' => [
                    'host' => $host,
                    'username' => $username,
                    'password' => $password,
                ],
            ];

            if ($domain = $this->getEnv('file_preview_endpoint')) {
                $backend['domain'] = $domain;
            }

            if ($port = $this->getEnv('storage_ftp_port')) {
                $backend['config']['port'] = (int) $port;
            }

            if ($passive = $this->getEnv('storage_ftp_passive')) {
                $backend['config']['passive'] = $passive;
            }

            if ($ssl = $this->getEnv('storage_ftp_ssl')) {
                $backend['config']['ssl'] = $ssl;
            }

            $this->settings['backends'][] = $backend;
        }
    }

    protected function maybeCreateS3Backend()
    {
        $key = $this->getEnv('storage_s3_key');
        $secret = $this->getEnv('storage_s3_secret');
        $region = $this->getEnv('storage_s3_region');
        $bucket = $this->getEnv('storage_s3_bucket');
        $endpoint = $this->getEnv('storage_s3_endpoint');
        if ($key && $secret && $region && $bucket) {
            $backend = [
                'id' => Str::random(10),
                'name' => 'S3',
                'type' => 's3',
                'config' => [
                    'key' => $key,
                    'secret' => $secret,
                    'region' => $region,
                    'bucket' => $bucket,
                ],
            ];

            if ($domain = $this->getEnv('file_preview_endpoint')) {
                $backend['domain'] = $domain;
            }

            if ($endpoint) {
                $backend['config']['endpoint'] = $endpoint;
            }

            if (settings('uploads.s3_direct_upload')) {
                $backend['config']['direct_upload'] = true;
            }

            if ($this->getEnv('storage_s3_use_path_style_endpoint')) {
                $backend['config']['use_path_style_endpoint'] = true;
            }

            $this->settings['backends'][] = $backend;
        }
    }

    protected function maybeCreateDigitalOceanBackend()
    {
        $key = $this->getEnv('storage_digitalocean_key');
        $secret = $this->getEnv('storage_digitalocean_secret');
        $region = $this->getEnv('storage_digitalocean_region');
        $bucket = $this->getEnv('storage_digitalocean_bucket');
        if ($key && $secret && $region && $bucket) {
            $backend = [
                'id' => Str::random(10),
                'name' => 'DigitalOcean',
                'type' => 'digitalocean',
                'config' => [
                    'key' => $key,
                    'secret' => $secret,
                    'region' => $region,
                    'bucket' => $bucket,
                ],
            ];

            if ($domain = $this->getEnv('file_preview_endpoint')) {
                $backend['domain'] = $domain;
            }

            if (settings('uploads.s3_direct_upload')) {
                $backend['config']['direct_upload'] = true;
            }

            $this->settings['backends'][] = $backend;
        }
    }

    protected function maybeCreateBackblazeBackend()
    {
        $key = $this->getEnv('storage_backblaze_key');
        $secret = $this->getEnv('storage_backblaze_secret');
        $bucket = $this->getEnv('storage_backblaze_bucket');
        if ($key && $secret && $bucket) {
            $backend = [
                'id' => Str::random(10),
                'name' => 'Backblaze',
                'type' => 'backblaze',
                'config' => [
                    'key' => $key,
                    'secret' => $secret,
                    'bucket' => $bucket,
                ],
            ];

            if ($domain = $this->getEnv('file_preview_endpoint')) {
                $backend['domain'] = $domain;
            }

            if (settings('uploads.s3_direct_upload')) {
                $backend['config']['direct_upload'] = true;
            }

            $this->settings['backends'][] = $backend;
        }
    }

    protected function maybeCreateDropboxBackend()
    {
        $key = $this->getEnv('storage_dropbox_app_key');
        $secret = $this->getEnv('storage_dropbox_app_secret');
        $refreshToken = $this->getEnv('storage_dropbox_refresh_token');
        if ($key && $secret && $refreshToken) {
            $backend = [
                'id' => Str::random(10),
                'name' => 'Dropbox',
                'type' => 'dropbox',
                'config' => [
                    'key' => $key,
                    'secret' => $secret,
                    'refresh_token' => $refreshToken,
                ],
            ];
            $this->settings['backends'][] = $backend;
        }
    }

    protected function getEnv(string $key)
    {
        return $this->env[$key] ?? null;
    }
};
