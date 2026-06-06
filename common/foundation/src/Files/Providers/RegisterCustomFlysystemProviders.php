<?php

namespace Common\Files\Providers;

use GuzzleHttp\Exception\ClientException;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\WebDAV\WebDAVAdapter;
use Sabre\DAV\Client;
use League\Flysystem\Filesystem as Flysystem;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use League\Flysystem\FilesystemAdapter as FlysystemAdapter;
use Illuminate\Support\Facades\Http;
use League\Flysystem\PathPrefixing\PathPrefixedAdapter;
use Spatie\FlysystemDropbox\DropboxAdapter;
use Spatie\Dropbox\Client as DropboxClient;
use Spatie\Dropbox\RefreshableTokenProvider;

class RegisterCustomFlysystemProviders
{
    public function execute()
    {
        $this->digitalOcean();
        $this->backblaze();
        $this->webdav();
        $this->dropbox();
    }

    protected function digitalOcean()
    {
        Storage::extend('digitalocean', function ($app, $config) {
            $config[
                'endpoint'
            ] = "https://{$config['region']}.digitaloceanspaces.com";

            return app(FilesystemManager::class)->createS3Driver($config);
        });
    }

    public function backblaze()
    {
        Storage::extend('backblaze', function ($app, $config) {
            $config[
                'endpoint'
            ] = "https://s3.{$config['region']}.backblazeb2.com";

            return app(FilesystemManager::class)->createS3Driver($config);
        });
    }

    public function webdav()
    {
        Storage::extend('webdav', function ($app, $config) {
            $client = new Client([
                'baseUri' => $config['baseUri'] ?? $config['url'],
                'userName' => $config['userName'] ?? $config['username'],
                'password' => $config['password'],
            ]);
            $adapter = new WebDAVAdapter($client);

            return $this->createFlysystem($adapter, $config);
        });
    }

    protected function dropbox()
    {
        Storage::extend('dropbox', function ($app, $config) {
            $config = array_merge($config, ['case_sensitive' => false]);

            $tokenProvider = new class ($config) implements
                RefreshableTokenProvider
            {
                protected string|null $token;
                protected string $cacheKey;

                public function __construct(protected array $config)
                {
                    $this->cacheKey = "dropbox_at_{$this->config['backend_id']}";
                    $this->token = Cache::get($this->cacheKey);
                }

                public function refresh(ClientException $exception): bool
                {
                    return $this->token = Cache::remember(
                        $this->cacheKey,
                        Carbon::now()->addHours(4),
                        function () {
                            $response = Http::asForm()
                                ->throw()
                                ->post(
                                    "https://{$this->config['app_key']}:{$this->config['app_secret']}@api.dropbox.com/oauth2/token",
                                    [
                                        'grant_type' => 'refresh_token',
                                        'refresh_token' =>
                                            $this->config['refresh_token'],
                                    ],
                                );
                            return $response['access_token'] ?? null;
                        },
                    );
                }

                public function getToken(): string
                {
                    return $this->token ?? '';
                }
            };

            $adapter = new DropboxAdapter(new DropboxClient($tokenProvider));
            return $this->createFlysystem($adapter, $config);
        });
    }

    protected function createFlysystem(FlysystemAdapter $adapter, array $config)
    {
        if (!empty($config['prefix'])) {
            $adapter = new PathPrefixedAdapter($adapter, $config['prefix']);
        }

        return new FilesystemAdapter(
            new Flysystem($adapter, $config),
            $adapter,
            $config,
        );
    }
}
