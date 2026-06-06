<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use App\Team\Models\GroupSettings;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupSettingsController extends BaseController
{
    private function normalizeIntOrNull(mixed $value): int|null
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }
            if (is_numeric($trimmed)) {
                return (int) $trimmed;
            }
        }

        if (is_int($value)) {
            return $value;
        }

        if (is_float($value) && is_finite($value)) {
            return (int) $value;
        }

        return null;
    }

    private function normalizeLimitSettings(array $settings): array
    {
        foreach (['minDeposit', 'maxDeposit', 'minWithdrawal', 'maxWithdrawal', 'humanSupportPingRepeatMaxSeconds'] as $key) {
            if (array_key_exists($key, $settings)) {
                $settings[$key] = $this->normalizeIntOrNull($settings[$key]);
            }
        }

        return $settings;
    }

    public function show(int $groupId)
    {
        $this->authorize('index', Conversation::class);

        Group::query()->findOrFail($groupId);

        $record = GroupSettings::query()->where('group_id', $groupId)->first();

        // Ensure there is a stable, random public link token for this group
        // that can be used to construct a clean /lc/{token} URL for the
        // livechat widget without exposing group ids or department params.
        if (!$record) {
            $record = new GroupSettings();
            $record->group_id = $groupId;
        }

        if (!$record->public_link_token) {
            // 32-char random token, sufficiently unguessable.
            $record->public_link_token = Str::random(32);
            $record->save();
        }

        $settings = $record?->settings ?? [];
        if (!is_array($settings)) {
            $settings = [];
        }

        $settings = $this->normalizeLimitSettings($settings);

        return $this->success([
            'settings' => $settings,
            'public_link_token' => $record->public_link_token,
        ]);
    }

    public function update(Request $request, int $groupId)
    {
        $this->authorize('store', Conversation::class);

        Group::query()->findOrFail($groupId);

        // React forms often send empty strings for cleared number/url fields.
        // Convert those to null so validation passes and values can be cleared.
        $rawSettings = $request->input('settings');
        if (is_array($rawSettings)) {
            foreach (['minDeposit', 'maxDeposit', 'minWithdrawal', 'maxWithdrawal', 'rtpLink', 'websiteLink', 'humanSupportPingRepeatMaxSeconds'] as $key) {
                if (array_key_exists($key, $rawSettings) && is_string($rawSettings[$key]) && trim($rawSettings[$key]) === '') {
                    $rawSettings[$key] = null;
                }
            }
            $request->merge(['settings' => $rawSettings]);
        }

        $data = $this->validate($request, [
            'settings' => 'present|array',

            // Match fields from newtest4 Settings tab.
            'settings.brandName' => 'sometimes|string|min:1|max:255',
            'settings.welcomeMessage' => 'sometimes|string|min:1',

            // Weekly rebate schedule (free-text day/time, controlled via frontend)
            'settings.weeklyRebateDay' => 'sometimes|nullable|string|max:191',
            'settings.weeklyRebateTime' => 'sometimes|nullable|string|max:191',

            'settings.minDeposit' => 'sometimes|nullable|integer|min:0',
            'settings.maxDeposit' => 'sometimes|nullable|integer|min:0',
            'settings.minWithdrawal' => 'sometimes|nullable|integer|min:0',
            'settings.maxWithdrawal' => 'sometimes|nullable|integer|min:0',

            'settings.banks' => 'sometimes|nullable|string',
            'settings.ewallets' => 'sometimes|nullable|string',
            'settings.qris' => 'sometimes|boolean',

            'settings.websiteLink' => 'sometimes|nullable|url|max:2000',
            'settings.rtpLink' => 'sometimes|nullable|url|max:2000',

            // How long the notification ping repeats for queued/transferred conversations.
            // 0 means repeat until opened.
            'settings.humanSupportPingRepeatMaxSeconds' => 'sometimes|nullable|integer|min:0|max:3600',

            // Widget settings (group-specific overrides)
            'settings.widget' => 'sometimes|array',
            'settings.widget.logo_light' => 'sometimes|nullable|string',
            'settings.widget.logo_dark' => 'sometimes|nullable|string',
            'settings.widget.greeting' => 'sometimes|nullable|string',
            'settings.widget.greetingAnonymous' => 'sometimes|nullable|string',
            'settings.widget.introduction' => 'sometimes|nullable|string',
            'settings.widget.homeNewChatTitle' => 'sometimes|nullable|string',
            'settings.widget.homeNewChatSubtitle' => 'sometimes|nullable|string',
            'settings.widget.homeNewTicketTitle' => 'sometimes|nullable|string',
            'settings.widget.homeNewTicketSubtitle' => 'sometimes|nullable|string',
            'settings.widget.defaultMessage' => 'sometimes|nullable|string',
            'settings.widget.inputPlaceholder' => 'sometimes|nullable|string',
            'settings.widget.agentsAwayMessage' => 'sometimes|nullable|string',
            'settings.widget.inQueueMessage' => 'sometimes|nullable|string',
            'settings.widget.launcherIcon' => 'sometimes|nullable|string',
            'settings.widget.position' => 'sometimes|nullable|string|in:left,right',
            'settings.widget.defaultScreen' => 'sometimes|nullable|string',
            'settings.widget.defaultTheme' => 'sometimes|nullable|string|in:light,dark,system',
            'settings.widget.showAvatars' => 'sometimes|boolean',
            'settings.widget.showHcCard' => 'sometimes|boolean',
            'settings.widget.hideHomeArticles' => 'sometimes|boolean',
            'settings.widget.homeShowTickets' => 'sometimes|boolean',
            'settings.widget.fadeBg' => 'sometimes|boolean',
            'settings.widget.hide' => 'sometimes|boolean',
            'settings.widget.hideNavigation' => 'sometimes|boolean',
            'settings.widget.inheritThemes' => 'sometimes|boolean',
            'settings.widget.background' => 'sometimes|nullable|array',
            'settings.widget.homeLinks' => 'sometimes|nullable|array',
            'settings.widget.screens' => 'sometimes|nullable|array',
            'settings.widget.forms' => 'sometimes|nullable|array',
            'settings.widget.spacing' => 'sometimes|nullable|array',
            'settings.widget.spacing.side' => 'sometimes|nullable|string',
            'settings.widget.spacing.bottom' => 'sometimes|nullable|string',
        ]);

        $incoming = $data['settings'] ?? [];
        if (!is_array($incoming)) {
            $incoming = [];
        }

        $existingRecord = GroupSettings::query()->where('group_id', $groupId)->first();
        $existing = $existingRecord?->settings ?? [];
        if (!is_array($existing)) {
            $existing = [];
        }

        $merged = array_replace_recursive($existing, $incoming);

        // Ensure limits are stored as numbers (or null) not strings.
        if (isset($merged) && is_array($merged)) {
            $merged = $this->normalizeLimitSettings($merged);
        }

        $record = GroupSettings::query()->updateOrCreate(
            ['group_id' => $groupId],
            ['settings' => $merged],
        );

        // Make sure a public link token always exists after update as well.
        if (!$record->public_link_token) {
            $record->public_link_token = Str::random(32);
            $record->save();
        }

        return $this->success([
            'settings' => $this->normalizeLimitSettings($record->settings ?? []),
            'public_link_token' => $record->public_link_token,
        ]);
    }
}
