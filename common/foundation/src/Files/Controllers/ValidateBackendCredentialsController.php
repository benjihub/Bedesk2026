<?php

namespace Common\Files\Controllers;

use Common\Core\BaseController;
use Common\Files\Uploads\UploadBackend;
use Common\Files\Uploads\Uploads;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use League\Flysystem\AwsS3V3\AwsS3V3Adapter;
use League\Flysystem\UnableToCreateDirectory;

class ValidateBackendCredentialsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function __invoke()
    {
        $this->blockOnDemoSite();

        // validate payload
        $data = $this->validate(request(), [
            'id' => ['string', 'required'],
            'name' => ['string', 'required'],
            'type' => ['string', 'required'],
            'root' => ['string', 'nullable'],
            'config' => ['array'],
        ]);

        // check if credentials are valid by trying to store and delete file on actual disk
        try {
            if ($data['type'] === 'api') {
                $disk = null;
                $this->validateApiCredentials($data);
            } else {
                $disk = Uploads::disk(
                    'brandingImages',
                    new UploadBackend($data),
                );

                $disk->put('test.txt', 'test');
                $content = $disk->get('test.txt');
                $disk->delete('test.txt');
            }
        } catch (UnableToCreateDirectory $e) {
            return $this->error($e->getMessage());
        } catch (Exception $e) {
            return $this->error(
                __(
                    'These credentials are invalid. Please double-check them and try again.',
                ),
            );
        }

        // if s3 and direct upload is enabled, configure cors
        if (
            $disk?->getAdapter() instanceof AwsS3V3Adapter &&
            Arr::get($data, 'config.direct_upload')
        ) {
            $cors = [
                [
                    'AllowedOrigins' => [config('app.url')],
                    'AllowedMethods' => ['GET', 'HEAD', 'POST', 'PUT'],
                    'MaxAgeSeconds' => 3000,
                    'AllowedHeaders' => ['*'],
                    'ExposeHeaders' => ['ETag'],
                ],
            ];

            try {
                $disk->getClient()->putBucketCors([
                    'Bucket' => $data['config']['bucket'],
                    'CORSConfiguration' => [
                        'CORSRules' => $cors,
                    ],
                ]);
            } catch (Exception $e) {
                return $this->error(
                    __(
                        'Could not configure bucket for direct upload. Make sure bucket exists and you have required permissions.',
                    ),
                );
            }
        }

        return $this->success();
    }

    protected function validateApiCredentials(array $data): bool
    {
        $response = Http::throw()
            ->withHeaders([
                'Authorization' => 'Bearer ' . $data['config']['apiKey'],
            ])
            ->get($data['config']['domain'] . '/api/v1/file-entries');

        return true;
    }
}
