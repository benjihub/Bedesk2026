Telegram feature (standalone)
=============================

This feature provides a standalone Telegram integration located under `app/Features/Telegram`.

What I scaffolded
- `TelegramServiceProvider` — registers routes and migrations and binds contracts to implementations.
- `routes/api.php` — webhook and message endpoints (prefix: `/telegram`).
- `Http/Controllers` — `TelegramWebhookController`, `TelegramMessageController`.
- `Application/Services` — webhook and message service stubs.
- `Contracts`, `Support`, `Infrastructure/Clients` — client interface and default implementation.
- `config/telegram.php` — configuration (add `TELEGRAM_BOT_TOKEN` to your env).

Integration notes for the LiveChat team
- The feature is intentionally self-contained so the LiveChat upgrade (Laravel 13) can import it.
- To enable routing, register the provider in your application providers list (e.g. `config/app.php`):

  App\Features\Telegram\TelegramServiceProvider::class,

- Configure `TELEGRAM_BOT_TOKEN` in the environment and, if desired, supply a bridge implementation by setting `TELEGRAM_BRIDGE_CLASS` to a class that implements `App\Features\Telegram\Contracts\TelegramBridgeInterface`.
- The routes are registered under the `/api/telegram` prefix and are exempted from API verify middleware to allow external webhooks.


Files modified outside `app/Features/Telegram`
- `app/Providers/AppServiceProvider.php`
  - Registers Telegram inbound/outbound listeners and typing indicators.
- `app/Events/TelegramUpdateReceived.php`
  - Event used to dispatch incoming Telegram webhook payloads into the app.
- `common/foundation/src/Core/Middleware/TrustHosts.php`
  - Allows ngrok/dev hostnames so Telegram webhooks work during local testing.
- `config/telegram.php`
  - Central Telegram runtime configuration mapped from environment values.
- `env.example`
  - Documents required `TELEGRAM_*` keys for setup.

Production setup checklist
- Set `TELEGRAM_BOT_TOKEN` in production `.env`.
- Set `TELEGRAM_BRIDGE_CLASS` to `App\Features\Telegram\Support\LiveChatTelegramBridge`.
- Ensure the public HTTPS webhook URL points to `/api/telegram/webhook`.
- Run `php artisan config:clear`, `php artisan route:clear`, and then `php artisan config:cache` after deployment.
- Register the webhook with Telegram using `setWebhook`.


Next steps the LiveChat team should do
- Provide a real bridge implementation that forwards Telegram updates into LiveChat (implement `TelegramBridgeInterface`).
- Optionally replace the `TelegramApiClient` or extend it with richer handling (attachments, reply markup, etc.).
- Register any migrations from `app/Features/Telegram/database/migrations` if added.
