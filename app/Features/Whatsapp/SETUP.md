# WhatsApp Feature Setup

This guide explains how to enable and test the WhatsApp feature in this project.

## 1) Prerequisites

- Laravel app is running.
- Database is configured and reachable.
- You have a Meta app with WhatsApp Cloud API enabled.
- You have a WhatsApp test phone number (or production number) connected in Meta.

## 2) Enable the Feature in Environment

Add or update these keys in your `.env`:

```dotenv
WHATSAPP_ENABLED=true
WHATSAPP_BRIDGE=App\Features\Whatsapp\Support\LoggingWhatsappBridge

WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_meta_app_secret
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_DEFAULT_ACCOUNT_NAME=Default WhatsApp Account
WHATSAPP_API_BASE_URL=https://graph.facebook.com/v25.0

WHATSAPP_VERIFY_SIGNATURES=true
WHATSAPP_LOG_WEBHOOKS=true
WHATSAPP_SIGNATURE_HEADER=X-Hub-Signature-256
```

Notes:

- `WHATSAPP_ACCESS_TOKEN` must be valid (expired tokens cause send failures).
- In this codebase, signature checks are enforced in production when enabled.
- In non-production environments, invalid signatures are logged and webhook processing can continue for local testing.

After any `.env` change:

```bash
php artisan config:clear
php artisan cache:clear
```

## 3) Database and Bootstrapping

Run migrations:

```bash
php artisan migrate
```

The WhatsApp feature provider is already registered via module bootstrapping (`app/Core/Modules.php`) and module config (`config/modules.php`).

## 4) Configure Webhook in Meta

In Meta WhatsApp Cloud API settings:

- Callback URL: `https://<your-public-domain>/api/whatsapp/webhook`
- Verify token: same value as `WHATSAPP_VERIFY_TOKEN`

Subscribe to webhook fields you need (minimum recommended):

- `messages`
- `message_status` (or equivalent delivery status field in your app setup)

## 5) Local Development (ngrok)

If running locally, expose your app:

```bash
ngrok http 8000
```

Use the https ngrok URL as webhook callback.

## 6) Verify Handshake

Meta verification is a GET request on `/api/whatsapp/webhook`.
Expected behavior:

- Valid verify token: returns raw `hub.challenge` with HTTP 200.
- Invalid token: returns plain `Forbidden` with HTTP 403.

Quick manual test:

```bash
curl -i "https://<your-public-domain>/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=12345"
```

## 7) Inbound Message Flow

Inbound webhook payloads are accepted in both shapes:

- Meta `entry[].changes[]` envelope
- Top-level `field` + `value` envelope

What happens on inbound:

- Payload is validated and parsed.
- Incoming message is persisted in `whatsapp_messages`.
- Conversation message is created in helpdesk (`channel = whatsapp`).
- AI flow can be triggered (same model as LINE integration).

Local smoke test without Meta webhook:

```bash
php artisan whatsapp:test-webhook --phone=2348012345678
```

## 8) Outbound Message Flow

Dashboard replies and API sends go through WhatsApp service/client and call Meta Graph:

- Endpoint: `POST /api/whatsapp/messages`

Example:

```bash
curl -i -X POST "http://127.0.0.1:8000/api/whatsapp/messages" \
  -H "Content-Type: application/json" \
  -d '{"to":"256756839069","type":"text","body":"Hello from dashboard"}'
```

## 9) AI Replies (LINE-style Behavior)

WhatsApp inbound listener mirrors LINE behavior:

- New conversations are assigned to bot when AI is enabled.
- Existing conversations can be routed back to bot when handoff is not active.
- AI reply trigger uses `Livechat\Widget\HandleLatestUserMessage`.

To enable AI replies, ensure AI is enabled in app settings (`aiAgent.enabled`) and provider keys are configured.

## 10) Typing Indicator Support

WhatsApp typing indicators are supported in this feature.

- Listener: `SendTypingToWhatsapp`
- Trigger source: `ConversationTyping` events from agent/bot side
- Meta call format uses message endpoint with:
  - `status: read`
  - `message_id: <latest inbound provider message id>`
  - `typing_indicator: {"type":"text"}`

Important:

- Typing requires a valid, non-expired access token.
- Typing is throttled to avoid flooding provider API.

## 11) Image Messages

Inbound image messages are handled as attachments:

- Message body fallback is `[image]`.
- Media is downloaded via WhatsApp media API and stored as a file entry.
- Attachment is linked to the conversation message.

## 12) Troubleshooting

### Invalid signature

- Check `WHATSAPP_APP_SECRET` and `WHATSAPP_SIGNATURE_HEADER`.
- In production with `WHATSAPP_VERIFY_SIGNATURES=true`, invalid signatures are rejected.

### Token expired / send fails

Typical error: OAuthException code `190`.

Fix:

- Rotate `WHATSAPP_ACCESS_TOKEN`.
- Run:

```bash
php artisan config:clear
php artisan cache:clear
```

### Dashboard receives but cannot send

- Confirm phone number ID and token belong to same WhatsApp Business setup.
- Verify outbound API response in logs and `whatsapp_messages` table.

### Images not showing

- Check logs for media download warnings.
- Ensure token has permission to fetch media.
- Re-test with a fresh image event (old signed media URLs may expire).

## 13) Useful Checks

```bash
php artisan whatsapp:test-webhook
tail -n 200 storage/logs/laravel-$(date +%Y-%m-%d).log
```
## 14) Files Modified Outside `app/Features/Whatsapp`

These files were modified as part of WhatsApp integration, even though they are outside the feature folder:

- `app/Core/Modules.php`
  - Registers and boots `WhatsappServiceProvider` in the module loader.
- `config/modules.php`
  - Adds the `whatsapp` module entry/label.
- `config/whatsapp.php`
  - Central WhatsApp runtime configuration mapped from environment.
- `env.example`
  - Documents required `WHATSAPP_*` environment keys for setup.
- `app/Providers/AppServiceProvider.php`
  - Wires events/listeners for WhatsApp inbound handling, outbound sends, and typing indicators.