<?php namespace Common\Settings\Manager;

use Common\Core\BaseController;
use Common\Settings\Models\Setting;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

class SettingsController extends BaseController
{
    public function __construct(protected Request $request) {}

    public function index()
    {
        $this->authorize('index', Setting::class);

        $settings = (new LoadSettingsManagerData())->execute();

        if (!$this->isSettingsOwner()) {
            $settings = $this->filterLivechatSettingsData($settings);
        }

        if (config('app.demo')) {
            $settings = (new RedactSensitiveSettings())->execute($settings);
        }

        return $this->success($settings);
    }

    public function update()
    {
        if (
            !$this->isSettingsOwner() &&
            !$this->request->user()?->hasPermission('livechat.update')
        ) {
            throw new AuthorizationException();
        }

        $this->blockOnDemoSite();

        if (!$this->isSettingsOwner() && $this->request->allFiles()) {
            throw new AuthorizationException(
                'This permission can only update livechat settings.',
            );
        }

        $data = (new ValidateSettingsManagerData())->execute();

        if (!$this->isSettingsOwner()) {
            $this->ensureOnlyLivechatSettings($data);
        }

        (new StoreSettingsManagerData())->execute($data);

        return $this->success();
    }

    public function loadSeoTags()
    {
        if (!$this->isSettingsOwner()) {
            throw new AuthorizationException();
        }

        return response()->json([
            'tags' => (new LoadSettingsManagerData())->loadSeoTags(),
        ]);
    }

    public function loadMenuEditorConfig()
    {
        return (new LoadSettingsManagerData())->loadMenuEditorConfig();
    }

    protected function isSettingsOwner(): bool
    {
        $user = $this->request->user();

        return (bool) ($user?->hasPermission('superAdmin') ||
            $user?->hasPermission('admin'));
    }

    protected function filterLivechatSettingsData(array $settings): array
    {
        $settings['server'] = [];
        $settings['custom_code'] = [];
        $settings['seo'] = [];
        $settings['client'] = array_intersect_key($settings['client'] ?? [], [
            'chatWidget' => true,
            'chatPage' => true,
            'lc' => true,
        ]);
        $settings['themes'] = collect($settings['themes'] ?? [])
            ->filter(fn($theme) => ($theme['type'] ?? null) === 'chatWidget')
            ->values()
            ->all();
        $settings['defaults']['client'] = array_intersect_key(
            $settings['defaults']['client'] ?? [],
            [
                'chatWidget' => true,
                'chatPage' => true,
                'lc' => true,
            ],
        );

        return $settings;
    }

    protected function ensureOnlyLivechatSettings(array $data): void
    {
        if (
            !empty($data['server']) ||
            !empty($data['custom_code']) ||
            !empty($data['seo'])
        ) {
            throw new AuthorizationException(
                'This permission can only update livechat settings.',
            );
        }

        foreach (array_keys($data['client'] ?? []) as $key) {
            if (
                !str_starts_with($key, 'chatWidget.') &&
                !str_starts_with($key, 'chatPage.') &&
                !str_starts_with($key, 'lc.')
            ) {
                throw new AuthorizationException(
                    'This permission can only update livechat settings.',
                );
            }
        }

        foreach ($data['themes'] ?? [] as $theme) {
            if (($theme['type'] ?? null) !== 'chatWidget') {
                throw new AuthorizationException(
                    'This permission can only update livechat settings.',
                );
            }
        }
    }
}
