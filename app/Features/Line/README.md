LINE Feature
============

This feature handles LINE webhooks and sending messages via LINE.

Quick setup
-----------
1. Add environment variables to your `.env`:

```
LINE_ENABLED=true
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_TOKEN=your_channel_token
LINE_WEBHOOK_SECRET=your_webhook_secret
LINE_BRIDGE=App\Features\Line\Support\NullLineBridge
```

2. Run migrations:

```bash
composer dump-autoload
php artisan config:clear
php artisan migrate
```

Routes
------
- `POST /api/line/webhook` — incoming webhook (signature verified when `LINE_VERIFY_SIGNATURES=true`)
- `POST /api/line/messages` — send a message (JSON: `to`, `type`, `body`, optional `account_id`)

Testing webhook locally
-----------------------
Example using `openssl` to compute the LINE signature header:

```bash
export LINE_WEBHOOK_SECRET="your_webhook_secret"
BODY='{"events":[{"type":"message","message":{"id":"12345","type":"text","text":"hello"},"source":{"userId":"U123"},"timestamp":1600000000000}],"destination":"YOUR_CHANNEL_ID"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$LINE_WEBHOOK_SECRET" -binary | base64)

curl -v -X POST http://localhost/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIG" \
  -d "$BODY"
```

Running tests
-------------
Run the new feature tests:

```bash
./vendor/bin/phpunit tests/Feature/LineWebhookTest.php
./vendor/bin/phpunit tests/Feature/LineMessageTest.php
```

Files modified outside `app/Features/Line`
------------------------------------------
- `app/Providers/AppServiceProvider.php`
  - Registers LINE listeners for incoming messages, outgoing replies, and typing indicators.
- `config/line.php`
  - Central LINE runtime config (`LINE_DATA_API_BASE_URL`, `LINE_TYPING_SECONDS`, signatures, bridge, tokens).
- `common/foundation/src/Core/Middleware/VerifyCsrfToken.php`
  - Adds webhook/message endpoint exceptions so external LINE callbacks are accepted.
- `modules/ai/src/AiAgent/Conversations/AiAgent.php`
  - Dispatches `ConversationMessageCreated` for AI bot messages so LINE outbound listener can send replies.
- `modules/ai/src/AiAgent/Conversations/GroupReplyEngine.php`
  - Dispatches `ConversationMessageCreated` for group AI bot replies so LINE outbound listener can send replies.
- `database/seeders/LineTestSeeder.php`
  - Seeder used for local end-to-end LINE testing.
- `tests/Feature/LineWebhookTest.php`
  - Feature tests for webhook handling.
- `tests/Feature/LineMessageTest.php`
  - Feature tests for outbound message handling.

Bridge integration
------------------
Set `LINE_BRIDGE` to a class implementing `App\Features\Line\Contracts\LineBridgeInterface` to integrate with LiveChat.
