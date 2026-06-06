<?php

namespace App\Core;

use App\Features\Line\LineServiceProvider;
use App\Features\Whatsapp\WhatsappServiceProvider;
use App\Features\Telegram\TelegramServiceProvider;
use Ai\AiServiceProvider;
use Envato\EnvatoServiceProvider;
use Illuminate\Foundation\Application;
use Livechat\LiveChatServiceProvider;

class Modules
{
    public static function livechatInstalled(): bool
    {
        return config('modules.livechat.installed') ?? false;
    }

    public static function aiInstalled(): bool
    {
        return config('modules.ai.installed') ?? false;
    }

    public static function envatoInstalled(): bool
    {
        return config('modules.envato.installed') ?? false;
    }

    public static function register(Application $app): void
    {
        if (static::safeClassExists(EnvatoServiceProvider::class)) {
            config()->set([
                'modules.envato.installed' => true,
            ]);
            (new EnvatoServiceProvider($app))->register();
        }

        if (static::safeClassExists(WhatsappServiceProvider::class)) {
            config()->set([
                'modules.whatsapp.installed' => true,
            ]);
            if (static::whatsappEnabled()) {
                (new WhatsappServiceProvider($app))->register();
            }
        }

        if (static::safeClassExists(LineServiceProvider::class)) {
            config()->set([
                'modules.line.installed' => true,
            ]);
            if (static::lineEnabled()) {
                (new LineServiceProvider($app))->register();
            }
        }

        if (static::safeClassExists(TelegramServiceProvider::class)) {
            config()->set([
                'modules.telegram.installed' => true,
            ]);
            if (static::telegramEnabled()) {
                (new TelegramServiceProvider($app))->register();
            }
        }

        if (static::safeClassExists(LiveChatServiceProvider::class)) {
            config()->set([
                'modules.livechat.installed' => true,
                'modules.livechat.setup' => true,
            ]);
            (new LiveChatServiceProvider($app))->register();
        }

        $aiProviderExists = static::safeClassExists(AiServiceProvider::class);
        $aiModuleDetected = $aiProviderExists || static::aiModulePresent();

        if ($aiModuleDetected) {
            config()->set([
                'modules.ai.installed' => true,
            ]);
        }

        if ($aiProviderExists) {
            (new AiServiceProvider($app))->register();
        }
    }

    public static function boot(Application $app): void
    {
        if (static::safeClassExists(EnvatoServiceProvider::class)) {
            (new EnvatoServiceProvider($app))->boot();
            config()->set([
                'modules.envato.setup' =>
                    config('services.envato.client_id') &&
                    config('services.envato.client_secret') &&
                    config('services.envato.personal_token') &&
                    settings('envato.enable'),
            ]);
        }

        if (static::safeClassExists(WhatsappServiceProvider::class)) {
            if (static::whatsappEnabled()) {
                (new WhatsappServiceProvider($app))->boot();
            }
            $whatsappConfigured =
                static::whatsappEnabled() &&
                config('whatsapp.access_token') &&
                config('whatsapp.phone_number_id');
            config()->set([
                'modules.whatsapp.setup' => (bool) $whatsappConfigured,
            ]);
        }

        if (static::safeClassExists(LineServiceProvider::class)) {
            if (static::lineEnabled()) {
                (new LineServiceProvider($app))->boot();
            }
            $lineConfigured =
                static::lineEnabled() &&
                config('line.channel_secret') &&
                config('line.channel_token');
            config()->set([
                'modules.line.setup' => (bool) $lineConfigured,
            ]);
        }

        if (static::safeClassExists(TelegramServiceProvider::class)) {
            if (static::telegramEnabled()) {
                (new TelegramServiceProvider($app))->boot();
            }
            $telegramConfigured =
                static::telegramEnabled() &&
                config('telegram.bot_token');
            config()->set([
                'modules.telegram.setup' => (bool) $telegramConfigured,
            ]);
        }

        if (static::safeClassExists(LiveChatServiceProvider::class)) {
            (new LiveChatServiceProvider($app))->boot();
        }

        $aiProviderExists = static::safeClassExists(AiServiceProvider::class);
        $aiModuleDetected = $aiProviderExists || static::aiModulePresent();

        if ($aiProviderExists) {
            (new AiServiceProvider($app))->boot();
        }

        if ($aiModuleDetected) {
            config()->set([
                'modules.ai.setup' => !!(
                    config('services.openai.api_key') ||
                    config('services.anthropic.api_key') ||
                    config('services.gemini.api_key') ||
                    config('services.openrouter.api_key')
                ),
            ]);
        }
    }

    protected static function safeClassExists(string $className): bool
    {
        try {
            return class_exists($className);
        } catch (\Throwable $e) {
            return false;
        }
    }

    protected static function aiModulePresent(): bool
    {
        return is_dir(base_path('modules/ai'));
    }

    protected static function whatsappEnabled(): bool
    {
        return (bool) config('whatsapp.enabled', false);
    }

    protected static function lineEnabled(): bool
    {
        return (bool) config('line.enabled', false);
    }

    protected static function telegramEnabled(): bool
    {
        return (bool) config('telegram.enabled', true);
    }
}
