<?php

namespace Ai\AiAgent\Conversations;

use App\Team\Models\GroupAiAgentSettings;
use App\Team\Models\GroupPromotion;
use App\Team\Models\GroupSettings;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class AIGroupSettingsResolver
{
    private const DEFAULT_BRAND_NAME = 'VIP sec 45';

    private const DEFAULT_USER_ID_REQUEST_TEMPLATES = [
        'turnover' => 'Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya.',
        'withdraw' => 'Boleh minta USER ID-nya? Biar saya cek status withdraw kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'deposit' => 'Boleh minta USER ID-nya? Biar saya cek status deposit kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
        'password_reset' => 'Boleh minta USER ID-nya? Biar saya bantu reset password-nya 🔐. NOTE: USER ID cukup 1 kata ya.',
        'claim' => 'Boleh minta USER ID-nya? Biar saya bantu klaim promonya 🎁. NOTE: USER ID cukup 1 kata ya.',
        'qris' => 'Boleh minta USER ID-nya? Biar saya cek pembayaran QRIS-mu 🎯. NOTE: USER ID cukup 1 kata ya.',
        'generic' => 'Boleh minta USER ID-nya? Biar saya bantu prosesnya 🎰. NOTE: USER ID cukup 1 kata ya.',
    ];

    private const DEFAULT_RTP_TEMPLATES = [
        'Anda dapat melihat rates RTP live dan informasi lengkapnya langsung di halaman resmi kami: {{RTP_LINK}}.',
        'Untuk informasi RTP yang paling akurat dan terkini, silakan kunjungi halaman RTP kami: {{RTP_LINK}}.',
        'Untuk membantu Anda membuat keputusan yang tepat, Anda dapat menemukan informasi RTP waktu nyata kami di tautan berikut: {{RTP_LINK}}.',
    ];

    public function resolve(int|null $groupId): array
    {
        $site = [];
        if ($groupId) {
            $site = GroupSettings::query()->where('group_id', $groupId)->value('settings') ?? [];
        }
        if (!is_array($site)) $site = [];

        $brand = (string) ($site['brandName'] ?? '');
        $brand = trim($brand) !== '' ? trim($brand) : self::DEFAULT_BRAND_NAME;

        $weeklyRebateDay = isset($site['weeklyRebateDay']) ? (string) $site['weeklyRebateDay'] : '';
        $weeklyRebateTime = isset($site['weeklyRebateTime']) ? (string) $site['weeklyRebateTime'] : '';

        $rtpLink = $site['rtpLinkInput'] ?? $site['rtpLink'] ?? null;
        if (is_string($rtpLink)) {
            $rtpLink = trim($rtpLink);
            if ($rtpLink === '') $rtpLink = null;
        }

        $websiteLink = $site['websiteLink'] ?? null;
        if (is_string($websiteLink)) {
            $websiteLink = trim($websiteLink);
            if ($websiteLink === '') $websiteLink = null;
        }

        $depositLimits = $this->buildLimits($site['minDeposit'] ?? null, $site['maxDeposit'] ?? null);
        $withdrawLimits = $this->buildLimits($site['minWithdrawal'] ?? null, $site['maxWithdrawal'] ?? null);

        $banks = $this->normalizeList($site['banks'] ?? null);
        $ewallets = $this->normalizeList($site['ewallets'] ?? null);
        $qris = (bool) ($site['qris'] ?? false);

        $promotions = [];
        if ($groupId) {
            $promotions = GroupPromotion::query()
                ->where('group_id', $groupId)
                ->where('active', true)
                ->orderBy('id', 'desc')
                ->get()
                ->map(function (GroupPromotion $p) {
                    return [
                        'id' => $p->id,
                        'title' => $p->title,
                        'description' => $p->description,
                        'code' => $p->code,
                        'discount' => $p->discount,
                        'terms' => $this->normalizeLinesOrJsonArray($p->terms),
                        'howToClaim' => $this->normalizeLinesOrJsonArray($p->how_to_claim),
                    ];
                })
                ->values()
                ->all();
        }

        $overrides = [];
        if ($groupId) {
            $record = GroupAiAgentSettings::query()->where('group_id', $groupId)->first();
            $overrides = $record?->overrides ?? [];

            try {
                Log::debug('ai-settings.rawOverrides', [
                    'group_id' => $groupId,
                    'record_exists' => $record ? true : false,
                    'record_overrides' => $record?->overrides ?? null,
                ]);
            } catch (\Throwable $_) { /* ignore */ }
        }
        if (!is_array($overrides)) $overrides = [];

        $globalAiSettings = [];
        try {
            $globalAiSettings = settings('aiAgent') ?? [];
        } catch (\Throwable $_) {
            $globalAiSettings = [];
        }
        if (!is_array($globalAiSettings)) {
            $globalAiSettings = [];
        }

        $assistantName = Arr::get($overrides, 'name', Arr::get($globalAiSettings, 'name', 'AI assistant'));
        if (!is_string($assistantName) || trim($assistantName) === '') {
            $assistantName = 'AI assistant';
        } else {
            $assistantName = trim($assistantName);
        }

        $aiBehaviour = $overrides['personality'] ?? $overrides['customRules'] ?? '';
        if (!is_string($aiBehaviour)) $aiBehaviour = '';

        $userIdRequestTemplates = self::DEFAULT_USER_ID_REQUEST_TEMPLATES;
        $overrideTemplates = Arr::get($overrides, 'userIdRequestTemplates', []);
        if (is_array($overrideTemplates)) {
            foreach (['deposit', 'withdraw', 'turnover', 'password_reset', 'claim', 'qris', 'generic'] as $k) {
                $v = $overrideTemplates[$k] ?? null;
                if (is_string($v) && trim($v) !== '') {
                    $userIdRequestTemplates[$k] = trim($v);
                }
            }
        }

        try {
            Log::debug('ai-settings.userIdRequestTemplates', [
                'group_id' => $groupId,
                'templates' => $userIdRequestTemplates,
            ]);
            Log::debug('ai-settings.depositFlowOverride', [
                'group_id' => $groupId,
                'depositFlow' => Arr::get($overrides, 'depositFlow', null),
            ]);
        } catch (\Throwable $_) { /* ignore */ }

        return [
            'brandName' => $brand,
            'welcomeMessage' => $site['welcomeMessage'] ?? null,
            'weeklyRebateDay' => $weeklyRebateDay,
            'weeklyRebateTime' => $weeklyRebateTime,
            'websiteLink' => $websiteLink,
            'rtpLink' => $rtpLink,
            'depositLimits' => $depositLimits,
            'withdrawLimits' => $withdrawLimits,
            'promotions' => $promotions,
            'banks' => $banks,
            'ewallets' => $ewallets,
            'qris' => $qris,
            'paymentMethods' => $banks,
            'assistantName' => $assistantName,
            'aiBehaviour' => $aiBehaviour,
            'customMessages' => Arr::get($overrides, 'customMessages', null),
            'waitMessage' => Arr::get($overrides, 'waitMessage', null),
            'userIdRequestTemplates' => $userIdRequestTemplates,
            'aggregator' => Arr::get($overrides, 'aggregator', null),
            'rtpReplyTemplates' => $this->normalizeLinesOrJsonArray(Arr::get($overrides, 'rtpReplyTemplates', self::DEFAULT_RTP_TEMPLATES)),
            'depositFlow' => is_array(Arr::get($overrides, 'depositFlow', null)) ? Arr::get($overrides, 'depositFlow') : null,
        ];
    }

    private function buildLimits($min, $max): ?array
    {
        $minVal = $this->toNumberOrNull($min);
        $maxVal = $this->toNumberOrNull($max);

        if ($minVal === null && $maxVal === null) return null;

        return [
            'min' => $minVal,
            'max' => $maxVal,
        ];
    }

    private function toNumberOrNull($value): int|float|null
    {
        if ($value === null || $value === '') return null;
        if (is_int($value) || is_float($value)) return $value;
        if (is_string($value)) {
            $v = trim($value);
            if ($v === '') return null;
            if (is_numeric($v)) return $v + 0;
        }
        return null;
    }

    private function normalizeList($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(fn($v) => is_string($v) ? trim($v) : '', $value), fn($v) => $v !== ''));
        }
        if (is_string($value)) {
            $lines = preg_split('/\r\n|\r|\n/', $value);
            $lines = array_map(fn($l) => trim((string) $l), $lines ?: []);
            return array_values(array_filter($lines, fn($l) => $l !== ''));
        }
        return [];
    }

    private function normalizeLinesOrJsonArray($value): array
    {
        if ($value === null) return [];
        if (is_array($value)) return array_values($value);
        if (!is_string($value)) return [];

        $s = trim($value);
        if ($s === '') return [];

        if (str_starts_with($s, '[')) {
            try {
                $decoded = json_decode($s, true);
                if (is_array($decoded)) {
                    return array_values(array_filter(array_map(fn($v) => is_string($v) ? trim($v) : (string) $v, $decoded), fn($v) => $v !== ''));
                }
            } catch (\Throwable $_) {
                // ignore
            }
        }

        $lines = preg_split('/\r\n|\r|\n/', $s);
        $lines = array_map(fn($l) => trim((string) $l), $lines ?: []);
        return array_values(array_filter($lines, fn($l) => $l !== ''));
    }
}