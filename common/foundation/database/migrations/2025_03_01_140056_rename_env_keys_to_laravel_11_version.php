<?php

use Common\Settings\DotEnvEditor;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        $editor = new DotEnvEditor();
        $current = $editor->load();

        $keysToRename = [
            'ses_key' => 'aws_access_key_id',
            'ses_secret' => 'aws_secret_access_key',
            'ses_region' => 'aws_default_region',
            'cache_driver' => 'cache_store',
            'filesystem_driver' => 'filesystem_disk',
            'mail_driver' => 'mail_mailer',
            'queue_driver' => 'queue_connection',
            'broadcast_driver' => 'broadcast_connection'
        ];

        $keysToWrite = [];

        foreach ($keysToRename as $old => $new) {
            if (isset($current[$old])) {
                $keysToWrite[$new] = $current[$old];
                // this will remove old keys
                $keysToWrite[$old] = 'null';
            }
        }

        if (!empty($keysToWrite)) {
            $editor->write($keysToWrite);
        }
    }
};
