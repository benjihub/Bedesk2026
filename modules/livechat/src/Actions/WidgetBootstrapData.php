<?php

namespace Livechat\Actions;

use Ai\AiAgent\Models\AiAgent;
use Common\Settings\Themes\CssTheme;
use Common\Websockets\GetWebsocketCredentialsForClient;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use App\Team\LoadAllCompactAgents;
use App\Team\Models\Group;
use Common\Core\AppUrl;
use Common\Core\Bootstrap\BaseBootstrapData;
use Livechat\Chats\BuildNewChatGreeting;
use Livechat\Widget\Users\WidgetCustomerResource;
use Livechat\Widget\WidgetConversationLoader;
use Illuminate\Support\Str;

class WidgetBootstrapData extends BaseBootstrapData
{
    public array $data = [];
    public ?CssTheme $initialTheme = null;

    public function __construct()
    {
        $this->initData();
    }

    protected function initData(): void
    {
        // might be passed through via iframe url
        $flowId = request('flowId') ? (int) request('flowId') : null;
        $conversationId = request('conversationId')
            ? (int) request('conversationId')
            : null;
        $scopedHcCategoryId = request('scopedHcCategoryId')
            ? (int) request('scopedHcCategoryId')
            : null;
        $department = request('department') ? request('department') : null;
        $visitorId = request('visitorId') ?: null;

        // Use the same guard as widget API (chatWidget) so the customer
        // that owns conversations is the one we use to resolve
        // activeConversationData, ensuring chats resume correctly.
        $customer = auth('chatWidget')->user() ?? Auth::user();
        $activeConversation = (new WidgetConversationLoader())->activeConversationFor(
            $customer,
            $conversationId,
        );

        $settings = settings()->getUnflattened();
        $settings['base_url'] = config('app.url');
        $settings['html_base_uri'] = app(AppUrl::class)->htmlBaseUri;
        $settings[
            'broadcasting'
        ] = (new GetWebsocketCredentialsForClient())->execute();

        // Merge group-specific widget settings if department is provided.
        // "department" can be either a numeric group id or a group name,
        // same as in CreateChatAsCustomer.
        $group = null;
        if ($department) {
            if (is_numeric($department)) {
                $group = Group::with('settings')->find((int) $department);
            } else {
                $group = Group::where('name', $department)
                    ->with('settings')
                    ->first();
            }

            if ($group && $group->settings && isset($group->settings->settings['widget'])) {
                $groupWidgetSettings = $group->settings->settings['widget'];
                // Merge group widget settings into the chatWidget settings
                $settings['chatWidget'] = array_replace_recursive(
                    $settings['chatWidget'] ?? [],
                    $groupWidgetSettings
                );
            }
        }

        $aiAgent = $this->resolveAiAgentForGroup($group?->id ?? null);

        $this->data = [
            'themes' => $this->getThemes(),
            'activeConversationData' => $activeConversation,
            'user' => new WidgetCustomerResource($customer),
            'aiAgent' => $aiAgent
                ? [
                    'id' => $aiAgent->id,
                    'name' => $aiAgent->name,
                    'image' => $aiAgent->image,
                ]
                : null,
            'visitorId' => $visitorId,
            'guest_role' => app('guestRole')?->load('permissions'),
            'settings' => $settings,
            'agents' => (new LoadAllCompactAgents())->execute(),
            'sessionId' => Str::uuid(),
            'widgetAuthToken' => $customer
                ? $customer->id . '.' . hash_hmac('sha256', (string) $customer->id, config('app.widget_hmac_secret') ?: config('app.key'))
                : null,
            'newChatGreeting' => (new BuildNewChatGreeting(
                $customer,
                $flowId,
            ))->execute(),
            'csrf_token' => csrf_token(),
            'scopedHcCategoryId' => $scopedHcCategoryId,
            'department' => $department,
        ];

        $this->setLocalizationData();
        $this->setInitialTheme();
        $this->setUploadingTypes();

        if ($this->data['user']) {
            $this->data['user']->createOrTouchSession();
        }
    }

    protected function resolveAiAgentForGroup(int|null $groupId): AiAgent|null
    {
        $query = AiAgent::query()->where('enabled', true);

        if ($groupId) {
            $groupAgent = (clone $query)
                ->where('group_id', $groupId)
                ->orderBy('id')
                ->first();

            if ($groupAgent) {
                return $groupAgent;
            }
        }

        return $query
            ->whereNull('group_id')
            ->orderBy('id')
            ->first();
    }

    public function getThemes(): Collection
    {
        $themes = CssTheme::query()
            ->where(
                'type',
                settings('chatWidget.inheritThemes') ? 'site' : 'chatWidget',
            )
            ->where(function (Builder $builder) {
                $builder
                    ->where('default_dark', true)
                    ->orWhere('default_light', true);
            })
            ->get();

        if ($themes->isEmpty()) {
            $themes = CssTheme::query()->limit(2)->get();
        }

        return $themes;
    }

    protected function setInitialTheme(): void
    {
        $themes = $this->data['themes'];

        if ($defaultTheme = settings('chatWidget.defaultTheme')) {
            // when default theme is set to system, use light theme
            // initially as there's no way to get user's preference
            // without javascript. Correct theme variables will be set once front end loads.
            if ($defaultTheme === 'system' || $defaultTheme === 'light') {
                $this->initialTheme = $themes
                    ->where('default_light', true)
                    ->first();
            } else {
                $this->initialTheme = $themes
                    ->where('default_dark', true)
                    ->first();
            }
        }

        // finally, fallback to default light theme
        if (!$this->initialTheme) {
            $this->initialTheme =
                $themes->where('default_light', true)->first() ??
                $themes->first();
        }
    }
}
