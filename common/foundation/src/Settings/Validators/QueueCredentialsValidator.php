<?php

namespace Common\Settings\Validators;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Queue;
use Throwable;

class QueueCredentialsValidator
{
    const KEYS = [
        'queue_connection',

        // sqs
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'SQS_PREFIX',
        'SQS_QUEUE',
        'AWS_DEFAULT_REGION',
    ];

    public function fails($settings)
    {
        $this->setConfigDynamically($settings);

        $driver = Arr::get(
            $settings,
            'queue_connection',
            config('queue.default'),
        );
        try {
            Queue::connection($driver)->size();
        } catch (Throwable $e) {
            return $this->getErrorMessage($e, $driver);
        }
    }

    private function setConfigDynamically($settings): void
    {
        foreach ($settings as $key => $value) {
            // SQS_QUEUE_KEY => sqs.queue.key
            $key = strtolower(str_replace('_', '.', $key));
            // sqs.queue.key => sqs.key
            $key = str_replace('queue.', '', $key);
            $key = str_replace('name', 'queue', $key);
            config("queue.connections.$key", $value);
        }
    }

    private function getErrorMessage(Throwable $e, string $driver): array
    {
        return [
            'queue_group' => "Could not change queue driver to <strong>$driver</strong>.<br> {$e->getMessage()}",
        ];
    }
}
