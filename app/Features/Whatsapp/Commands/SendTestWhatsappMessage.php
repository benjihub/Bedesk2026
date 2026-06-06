<?php

namespace App\Features\Whatsapp\Commands;

use App\Features\Whatsapp\Domain\DTO\IncomingMessage;
use App\Features\Whatsapp\Domain\Events\IncomingMessageReceived;
use App\Features\Whatsapp\Models\WhatsappAccount;
use App\Features\Whatsapp\Models\WhatsappContact;
use Illuminate\Console\Command;

class SendTestWhatsappMessage extends Command
{
    protected $signature = 'whatsapp:test-webhook {--phone=2348012345678 : Phone number to send from}';
    protected $description = 'Send a test WhatsApp message (for local testing without real webhook)';

    public function handle(): int
    {
        $phone = $this->option('phone');

        // Ensure account exists
        $account = WhatsappAccount::firstOrCreate(
            ['phone_number_id' => config('whatsapp.phone_number_id')],
            [
                'access_token' => config('whatsapp.access_token'),
                'business_account_id' => config(
                    'whatsapp.business_account_id',
                ),
                'name' => 'Default Account',
                'is_default' => true,
            ],
        );

        // Create test contact
        $contact = WhatsappContact::updateOrCreate(
            ['account_id' => $account->id, 'wa_id' => $phone],
            ['phone' => $phone, 'name' => 'Test User'],
        );

        // Create test incoming message
        $incomingMessage = new IncomingMessage(
            providerMessageId: 'test_' . uniqid(),
            from: $phone,
            to: config('whatsapp.phone_number_id'),
            type: 'text',
            body: 'Test message from WhatsApp webhook at ' . now(),
            timestamp: (string) now()->timestamp,
            contactName: 'Test User',
            contactWaId: $phone,
            raw: [
                'id' => 'test_message',
                'from' => $phone,
                'type' => 'text',
                'text' => [
                    'body' => 'Test message from WhatsApp webhook',
                ],
            ],
        );

        // Fire event
        event(
            new IncomingMessageReceived(
                $incomingMessage,
                null,
                $account->id,
            ),
        );

        $this->info('✓ Test message dispatched!');
        $this->info('Check: storage/logs/laravel.log for bridge logs');
        $this->info('Check: whatsapp_messages table for stored message');

        return self::SUCCESS;
    }
}
