<?php

namespace Common\Files\S3;

use Carbon\Carbon;
use Common\Core\BaseController;
use Common\Files\Actions\FileUploadValidator;
use Common\Files\S3\InteractsWithS3Api;
use Common\Files\Uploads\Uploads;

class S3MultipartUploadController extends BaseController
{
    use InteractsWithS3Api;

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function create()
    {
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

        $result = $this->getClient()->createMultipartUpload([
            'Key' => $this->buildFileKey(),
            'Bucket' => $this->getBucket(),
            'ContentType' => $data['clientMime'],
            'ACL' => $uploadType->getS3ACL(),
        ]);

        return $this->success([
            'key' => $result['Key'],
            'uploadId' => $result['UploadId'],
            'acl' => $uploadType->getS3ACL(),
        ]);
    }

    public function getUploadedParts()
    {
        $data = $this->getClient()->listParts([
            'Bucket' => $this->getBucket(),
            'Key' => request('key'),
            'UploadId' => request('uploadId'),
            'PartNumberMarker' => 0,
        ]);

        return $this->success([
            'parts' => $data['Parts'],
        ]);
    }

    public function batchSignPartUrls()
    {
        $partNumbers = request()->input('partNumbers');

        $urls = [];

        foreach ($partNumbers as $partNumber) {
            $url = $this->getPartUrl(
                $partNumber,
                request('uploadId'),
                request('key'),
            );
            $urls[] = ['url' => $url, 'partNumber' => $partNumber];
        }

        return $this->success([
            'urls' => $urls,
        ]);
    }

    public function complete()
    {
        $data = $this->getClient()->completeMultipartUpload([
            'Bucket' => $this->getBucket(),
            'Key' => request()->input('key'),
            'UploadId' => request()->input('uploadId'),
            'MultipartUpload' => [
                'Parts' => request()->input('parts'),
            ],
        ]);

        return $this->success([
            'location' => $data['Location'],
        ]);
    }

    public function abort()
    {
        $this->getClient()->abortMultipartUpload([
            'Bucket' => $this->getBucket(),
            'Key' => request()->input('key'),
            'UploadId' => request()->input('uploadId'),
        ]);

        return $this->success();
    }

    protected function getPartUrl(
        string $partNumber,
        string $uploadId,
        string $key,
    ): string {
        $command = $this->getClient()->getCommand('UploadPart', [
            'Bucket' => $this->getBucket(),
            'Key' => $key,
            'UploadId' => $uploadId,
            'PartNumber' => $partNumber,
        ]);
        $s3Request = $this->getClient()->createPresignedRequest(
            $command,
            Carbon::now()->addMinutes(30),
        );

        return (string) $s3Request->getUri();
    }
}
