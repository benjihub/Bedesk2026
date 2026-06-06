<?php namespace Common\Settings;

use Common\Settings\Models\Setting;
use Common\Settings\Models\TransformsSettingsTableRowValue;
use Exception;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class Settings
{
    use TransformsSettingsTableRowValue;

    protected Collection $all;

    /**
     * Laravel config values that should be included with settings.
     * (display name for client => laravel config key)
     */
    protected array $configKeys = [
        'billing.stripe_public_key' => 'services.stripe.key',
        'billing.paypal.public_key' => 'services.paypal.client_id',
        'site.demo' => 'app.demo',
        'logging.sentry_public' => 'sentry.dsn',
        'i18n.default_localization' => 'app.locale',
        'billing.integrated' => 'app.billing_integrated',
        'websockets.integrated' => 'app.websockets_integrated',
        'incoming_email.integrated' => 'app.incoming_email_integrated',
        'workspaces.integrated' => 'app.workspaces_integrated',
        'notifications.integrated' => 'app.notifications_integrated',
        'notif.subs.integrated' => 'app.notif_subs_integrated',
        'api.integrated' => 'app.api_integrated',
        'branding.site_name' => 'app.name',
        'realtime.pusher_cluster' =>
            'broadcasting.connections.pusher.options.cluster',
        'realtime.pusher_key' => 'broadcasting.connections.pusher.key',
        'site.hide_docs_buttons' => 'app.hide_docs_buttons',
        'site.has_mobile_app' => 'app.has_mobile_app',
    ];

    /**
     * Settings that are json encoded in database.
     */
    public static array $jsonKeys = [
        'menus',
        'landingPage',
        'uploading',
        'cookie_notice.button',
        'registration.policies',
        'artistPage.tabs',
        'landing',
        'hcLanding',
        'chatWidget',
        'chatPage',
        'aiAgent',
        'hc.newTicket.appearance',
        'incoming_email',
        'title_page.sections',
        'streaming.qualities',
        'builder.template_categories',
        'publish.default_credentials',
    ];

    public static array $secretKeys = [
        'captcha.g_secret_key',
        'captcha.t_secret_key',
        'google_safe_browsing_key',
        'incoming_email',
        'uploading',
    ];

    public function __construct()
    {
        $this->loadSettings();
    }

    public function all(bool $includeSecret = false): array
    {
        $all = $this->all;

        // filter out secret (server-only) settings
        if (!$includeSecret) {
            $all = $all->filter(function ($value, $key) use ($includeSecret) {
                return !in_array($key, self::$secretKeys);
            });
        }

        return $all->toArray();
    }

    public function get(string|int $key, mixed $default = null): mixed
    {
        $value = Arr::get($this->all, $key) ?? $default;

        return is_string($value) ? trim($value) : $value;
    }

    /**
     * Get random setting value from fields that
     * have multiple values separated by newline.
     */
    public function getRandom(string $key, ?string $default = null): mixed
    {
        $key = $this->get($key, $default);
        $parts = explode("\n", $key);
        return $parts[array_rand($parts)];
    }

    public function getMenu(string $name)
    {
        return Arr::first(
            $this->get('menus'),
            fn($menu) => strtolower($menu['name']) === strtolower($name),
        );
    }

    public function has(string $key): bool
    {
        return !is_null(Arr::get($this->all, $key));
    }

    /**
     * Set single setting. Does not persist in database.
     */
    public function set(string $key, mixed $value): void
    {
        $this->all[$key] = $value;
    }

    /**
     * Persist specified settings in database.
     */
    public function save(array $settings): void
    {
        $settings = $this->flatten($settings);

        foreach ($settings as $key => $value) {
            $setting = Setting::firstOrNew(['name' => $key]);
            $setting->value = $value;

            // if it's a falsy value, remove it from db to prevent
            // settings table from being polluted with empty values
            if (
                is_null($value) ||
                $value === '' ||
                $value === false ||
                $value === '[]'
            ) {
                $setting->delete();
                unset($this->all[$key]);
            } else {
                $setting->save();
                $this->set($key, $setting->value);
            }
        }

        (new SyncSettingsWithFileEntries())->execute();

        Cache::forget('settings.public');
    }

    /**
     * Get all settings parsed from dot notation to assoc array. Also decodes JSON values.
     */
    public function getUnflattened(
        bool $includeSecret = false,
        array|null $settings = null,
    ): array {
        if (!$settings) {
            $settings = $this->all($includeSecret);
        }

        foreach ($settings as $key => $value) {
            if (in_array($key, self::$jsonKeys) && is_string($value)) {
                $settings[$key] = json_decode($value, true);
            }
        }

        $dot = dot($settings, true);

        return $dot->all();
    }

    /**
     * Flatten specified assoc array into dot array. (['billing.enable' => true])
     */
    public function flatten(array $settings): array
    {
        // this will find all json keys, encode them and remove decoded version from original array
        foreach (Settings::$jsonKeys as $key) {
            if (Arr::has($settings, $key)) {
                $value = Arr::pull($settings, $key);
                $settings[$key] = is_array($value)
                    ? json_encode($value)
                    : $value;
            }
        }

        $dot = dot($settings);

        // remove keys that were added from config files and are not stored in database
        $dotArray = $dot->delete(array_keys($this->configKeys))->flatten();

        // dot package leaves empty array as value for root element when deleting
        foreach ($dotArray as $key => $value) {
            if (is_array($value) && empty($value)) {
                unset($dotArray[$key]);
            }
        }

        return $dotArray;
    }

    protected function find(string $key)
    {
        return Arr::get($this->all, $key);
    }

    public function loadSettings(): void
    {
        $this->all = collect();

        // prevent using cache during package discover, if "settings" helper is used in route files
        if (!config('app.installed')) {
            return;
        }

        $value = Cache::get('settings.public');

        if ($value && count($value) > 0) {
            $this->all = $value;
        } else {
            try {
                $value = Setting::select('name', 'value')
                    ->get()
                    ->pluck('value', 'name');
                if (!$value->isEmpty()) {
                    $this->all = $value;
                    Cache::set('settings.public', $value, now()->addDay());
                }
            } catch (Exception $e) {
            }
        }

        // add config keys that should be included
        foreach ($this->configKeys as $clientKey => $configKey) {
            $this->set($clientKey, config()->get($configKey));
        }
    }

    public function getAllForFrontendForm(): array
    {
        $value = Setting::select('name', 'value')
            ->get()
            ->mapWithKeys(
                fn($setting) => [
                    $setting->name => $this->decodeDbValue(
                        $setting->name,
                        $setting->getRawOriginal('value'),
                        forceJsonArray: false,
                    ),
                ],
            )
            ->toArray();

        $value = dot($value, true)->all();

        // prevent objects being converted to arrays to avoid issues with forms on settings page
        foreach ($this->configKeys as $clientKey => $configKey) {
            $value[$clientKey] = config()->get($configKey);
        }
        return $value;
    }

    function castToArrayPreserveEmptyObjects(mixed $obj)
    {
        if (is_object($obj) || is_array($obj)) {
            $ret = (array) $obj;

            // don't convert empty objects to array
            if (is_object($obj) && empty($ret)) {
                return $obj;
            }

            foreach ($ret as &$item) {
                $item = $this->castToArrayPreserveEmptyObjects($item);
            }

            return $ret;
        } else {
            return $obj;
        }
    }
}
