<?php

namespace Common\Files\S3;

use Common\Core\BaseController;
use Common\Files\S3\InteractsWithS3Api;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Support\Facades\Storage;

class S3CorsController extends BaseController
{
    use InteractsWithS3Api;

    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function uploadCors()
    {
        $this->blockOnDemoSite();

        $this->validate(request(), [
            'uploadType' => 'required|string',
            'backendId' => 'required|string',
        ]);

        $cors = [
            [
                'AllowedOrigins' => [config('app.url')],
                'AllowedMethods' => ['GET', 'HEAD', 'POST', 'PUT'],
                'MaxAgeSeconds' => 3000,
                'AllowedHeaders' => ['*'],
                'ExposeHeaders' => ['ETag'],
            ],
        ];

        $this->getClient()->putBucketCors([
            'Bucket' => $this->getBucket(),
            'CORSConfiguration' => [
                'CORSRules' => $cors,
            ],
        ]);

        return $this->success();
    }
}
