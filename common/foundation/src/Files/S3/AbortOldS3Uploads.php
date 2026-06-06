<?php

namespace Common\Files\S3;

use Carbon\Carbon;
use Common\Files\Uploads\Uploads;
use Illuminate\Console\Command;

class AbortOldS3Uploads extends Command
{
    protected $signature = 's3:abort_expired';

    protected $description = 'Abort and delete expired S3 file uploads';

    public function handle(): int
    {
        $s3Backends = array_filter(
            Uploads::getAllBackends(),
            fn($backend) => $backend->isS3(),
        );

        foreach ($s3Backends as $backend) {
            $disk = Uploads::disk('avatars', $backend->id);

            $client = $disk->getClient();
            $bucket = $backend->config['bucket'];

            $data = $client->listMultipartUploads([
                'Bucket' => $bucket,
            ]);

            $uploads = $data['Uploads'] ?: [];

            foreach ($uploads as $upload) {
                $createdAt = Carbon::parse($upload['Initiated']);

                if ($createdAt->lessThanOrEqualTo(Carbon::now()->subDay())) {
                    $client->abortMultipartUpload([
                        'Bucket' => $bucket,
                        'Key' => $upload['Key'],
                        'UploadId' => $upload['UploadId'],
                    ]);
                }
            }
        }

        $this->info('Expired uploads deleted from S3');

        return Command::SUCCESS;
    }
}
