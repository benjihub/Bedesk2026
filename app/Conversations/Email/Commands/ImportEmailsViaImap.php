<?php

namespace App\Conversations\Email\Commands;

use App\Conversations\Email\Parsing\ParsedEmail;
use App\Conversations\Email\TransformEmailIntoTicketOrReply;
use App\Conversations\Email\Transformers\MimeMailTransformer;
use Illuminate\Console\Command;
use Illuminate\Support\Arr;
use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Folder;
use Webklex\PHPIMAP\Message;

class ImportEmailsViaImap extends Command
{
    protected $signature = 'imap:import {connection} {lastUid?}';

    public function handle(): void
    {
        $connectionId = $this->argument('connection');
        $connections = settings('incoming_email.imap.connections') ?? [];
        $connection = Arr::first(
            $connections,
            fn($connection) => $connection['id'] === $connectionId,
        );

        if (!$connection) {
            $this->error("Imap connection {$connectionId} not found");
            return;
        }

        $client = new ClientManager([
            'debug' => true,
            'accounts' => [
                'default' => [
                    'host' => $connection['host'],
                    'port' => $connection['port'] ?? null,
                    'username' => $connection['username'],
                    'password' => $connection['password'],
                    'authentication' =>
                        Arr::get($connection, 'authentication') === 'oauth'
                            ? 'oauth'
                            : null,
                ],
            ],
        ]);
        $client->connect();
        $folder = $client->getFolder($connection['folder'] ?? 'INBOX');

        if ($uidOverride = $this->argument('lastUid')) {
            $connection['lastUid'] = $uidOverride;
        }

        // we've not imported anything yet. Fetch last message UID and bail,
        // so we can start importing only new emails from this UID
        if (!isset($connection['lastUid'])) {
            $lastUid = $this->getLatestMessageUid($folder);
            $this->storeLastUid($connectionId, $lastUid);
            return;
        }

        $lastUid = $connection['lastUid'];
        $messages = $folder->query()->getByUidGreater($lastUid)->take(10);

        // filter out sent messages and leave only received ones
        $messages = $messages->filter(
            fn(Message $message) => $message->from->first()->mail !==
                $connection['username'],
        );

        foreach ($messages as $message) {
            $raw = $message->header->raw . $message->getStructure()->raw;
            $emailData = (new MimeMailTransformer())->transform($raw);

            (new TransformEmailIntoTicketOrReply(
                new ParsedEmail($emailData),
            ))->execute([
                'createNewTickets' => $connection['createTickets'] ?? false,
                'createReplies' => $connection['createReplies'] ?? false,
            ]);

            $lastUid = $message->getUid();
        }

        $this->storeLastUid($connectionId, $lastUid);

        $client->disconnect();

        $this->info("Handled {$messages->count()} emails, lastUid: {$lastUid}");
    }

    protected function storeLastUid(string $connectionId, string $uid): void
    {
        $config = settings('incoming_email');
        $index = array_search(
            $connectionId,
            array_column($config['imap']['connections'], 'id'),
        );
        if ($index !== false) {
            $config['imap']['connections'][$index]['lastUid'] = $uid;
            settings()->save([
                'incoming_email' => $config,
            ]);
        }
    }

    protected function getLatestMessageUid(Folder $folder): string
    {
        $messages = $folder
            ->messages()
            ->fetchBody(false)
            ->all()
            ->fetchOrder('desc')
            ->limit(1)
            ->get();
        return $messages->first()->getUid();
    }
}
