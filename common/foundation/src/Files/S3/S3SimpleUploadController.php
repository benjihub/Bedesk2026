<?php

namespace Common\Files\S3;

use Carbon\Carbon;
use Common\Core\BaseController;
use Common\Files\Actions\FileUploadValidator;
use Common\Files\S3\InteractsWithS3Api;
use Common\Files\Uploads\Uploads;

class S3SimpleUploadController extends BaseController
{
    use InteractsWithS3Api;

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function presignPost()
    {
        $fileKey = $this->buildFileKey();

        $data = $this->validate(request(), [
            'clientSize' => 'required|integer',
            'clientExtension' => 'required|string',
            'clientMime' => 'required|string',
            'uploadType' => 'required|string',
            'backendId' => 'required|string',
        ]);

        $uploadType = Uploads::type($data['uploadType']);
        $errors = FileUploadValidator::validateForUploadType(
            uploadType: $uploadType,
            fileSize: $data['clientSize'],
            extension: $data['clientExtension'],
            mime: $data['clientMime'],
        );
        if ($errors) {
            abort(422, $errors->first());
        }

        $command = $this->getClient()->getCommand('PutObject', [
            'Bucket' => $this->getBucket(),
            'ContentType' => $data['clientMime'],
            'Key' => $fileKey,
            'ACL' => $uploadType->getS3ACL(),
        ]);

        $uri = $this->getClient()
            ->createPresignedRequest($command, Carbon::now()->addHour())
            ->getUri();

        return $this->success([
            'url' => $uri,
            'key' => $fileKey,
            'acl' => $uploadType->getS3ACL(),
        ]);
    }
}
