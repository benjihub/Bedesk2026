<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use App\Team\Models\GroupAiAgentSettings;
use Ai\AiAgent\Models\AiAgentFlow;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rules\Exists;

class GroupAiAgentSettingsController extends BaseController
{
    public function show(int $groupId)
    {
        $this->authorize('index', Conversation::class);

        Group::query()->findOrFail($groupId);
        $this->currentGroupId = $groupId;

        $record = GroupAiAgentSettings::query()
            ->where('group_id', $groupId)
            ->first();

        $overrides = $record?->overrides ?? [];
        if (!is_array($overrides)) {
            $overrides = [];
        }

        return $this->success([
            'overrides' => $overrides,
            'effective' => $this->resolveEffectiveSettings($overrides),
            'flows' => $this->getAvailableFlows(),
        ]);
    }

    public function update(Request $request, int $groupId)
    {
        $this->authorize('store', Conversation::class);

        Group::query()->findOrFail($groupId);
        $this->currentGroupId = $groupId;

        $data = $this->validate($request, [
            'overrides' => 'present|array',
            'overrides.name' => 'sometimes|string|min:2|max:255',
            'overrides.image' => 'sometimes|nullable|string|max:500',
            'overrides.enabled' => 'sometimes|boolean',
            'overrides.personality' => 'sometimes|nullable|string',
            'overrides.greetingType' => 'sometimes|in:flow,basicGreeting',
            'overrides.initialFlowId' => [
                'sometimes',
                'nullable',
                'integer',
                $this->flowRule($groupId),
            ],
            'overrides.aggregator' => 'sometimes|array',
            // Value in milliseconds. newtest4 expects 1-10 seconds.
            'overrides.aggregator.windowMs' => 'sometimes|nullable|integer|min:1000|max:10000',
            'overrides.basicGreeting' => 'sometimes|array',
            'overrides.basicGreeting.message' => 'sometimes|nullable|string',
            'overrides.basicGreeting.flowIds' => 'sometimes|array',
            'overrides.basicGreeting.flowIds.*' => [
                'integer',
                $this->flowRule($groupId),
            ],
            'overrides.userIdRequestTemplates' => 'sometimes|array',
            'overrides.userIdRequestTemplates.deposit' => 'sometimes|nullable|string|max:2000',
            'overrides.userIdRequestTemplates.withdraw' => 'sometimes|nullable|string|max:2000',
            'overrides.userIdRequestTemplates.turnover' => 'sometimes|nullable|string|max:2000',
            'overrides.userIdRequestTemplates.password_reset' => 'sometimes|nullable|string|max:2000',
            'overrides.userIdRequestTemplates.claim' => 'sometimes|nullable|string|max:2000',
            'overrides.userIdRequestTemplates.qris' => 'sometimes|nullable|string|max:2000',
            // deposit flow templates
            'overrides.depositFlow' => 'sometimes|array',
            'overrides.depositFlow.askUsername' => 'sometimes|nullable|string|max:2000',
            'overrides.depositFlow.askProof' => 'sometimes|nullable|string|max:2000',
            'overrides.depositFlow.proofMissing' => 'sometimes|nullable|string|max:2000',
            'overrides.depositFlow.checking' => 'sometimes|nullable|string|max:2000',
            'overrides.depositFlow.doneResolved' => 'sometimes|nullable|string|max:2000',
            'overrides.depositFlow.doneUnresolved' => 'sometimes|nullable|string|max:2000',
            'overrides.transfer' => 'sometimes|array',
            'overrides.transfer.type' => 'sometimes|nullable|in:basicTransfer,instruction',
            'overrides.transfer.instruction' => 'sometimes|nullable|string',
            'overrides.waitMessage' => 'sometimes|nullable|string|max:2000',
            'overrides.cantAssist' => 'sometimes|array',
            'overrides.cantAssist.instruction' => 'sometimes|nullable|string',
            'overrides.rtpReplyTemplates' => 'sometimes|array',
            'overrides.rtpReplyTemplates.*' => 'sometimes|nullable|string|max:2000',
            'overrides.bigman' => 'sometimes|array',
            'overrides.bigman.token' => 'sometimes|nullable|string|max:500',
            'overrides.bigman.usernameToken' => 'sometimes|nullable|string|max:500',
            'overrides.bigman.depositEndpoint' => 'sometimes|nullable|string|max:500',
            'overrides.bigman.withdrawEndpoint' => 'sometimes|nullable|string|max:500',
        ]);

        $overrides = Arr::get($data, 'overrides', []);
        if (!is_array($overrides)) {
            $overrides = [];
        }

        \Log::debug('ai-agent-settings.update.request', ['groupId' => $groupId, 'overrides' => $overrides, 'raw' => $data]);

        // Strip nulls so "empty" fields behave like "inherit global".
        $overrides = $this->stripNulls($overrides);

        $record = GroupAiAgentSettings::query()->updateOrCreate(
            ['group_id' => $groupId],
            ['overrides' => $overrides],
        );

        \Log::debug('ai-agent-settings.update.saved', ['groupId' => $groupId, 'saved' => $record->overrides ?? []]);

        return $this->success([
            'overrides' => $record->overrides ?? [],
            'effective' => $this->resolveEffectiveSettings($record->overrides ?? []),
        ]);
    }

    protected function resolveEffectiveSettings(array $overrides): array
    {
        $current = settings('aiAgent') ?? [];
        if (!is_array($current)) {
            $current = [];
        }

        return array_replace_recursive(
            $this->getDefaultSettings(),
            $current,
            $overrides,
        );
    }

    protected function getDefaultSettings(): array
    {
        return [
            'name' => 'AI assistant',
            'image' => null,
            'enabled' => true,
            'personality' => '',
            'userIdRequestTemplates' => [
                'deposit' => 'Boleh minta USER ID-nya? Biar saya cek status deposit kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
                'withdraw' => 'Boleh minta USER ID-nya? Biar saya cek status withdraw kamu 🎰. NOTE: USER ID cukup 1 kata ya.',
                'turnover' => 'Boleh minta USER ID-nya? Biar saya cek turnover-nya 📊. NOTE: USER ID cukup 1 kata ya.',
                'password_reset' => 'Boleh minta USER ID-nya? Biar saya bantu reset password-nya 🔐. NOTE: USER ID cukup 1 kata ya.',
                'claim' => 'Boleh minta USER ID-nya? Biar saya bantu klaim promonya. NOTE: USER ID cukup 1 kata ya.',
                'qris' => 'Boleh minta USER ID-nya? Biar saya cek detail QRIS/nomor pembayaran. NOTE: USER ID cukup 1 kata ya.',
            ],
            'aggregator' => [
                'windowMs' => 5000,
            ],
            'greetingType' => 'basicGreeting',
            'initialFlowId' => null,
            'basicGreeting' => [
                'message' => 'Hello! How can I help you today?',
                'flowIds' => [],
            ],
            'transfer' => [
                'type' => 'basicTransfer',
                'instruction' => null,
            ],
            'cantAssist' => [
                'instruction' => null,
            ],
            'waitMessage' => 'Oke, tunggu sebentar ya — lagi dicek.',
            'rtpReplyTemplates' => [
                'Anda dapat melihat rates RTP live dan informasi lengkapnya langsung di halaman resmi kami: {{RTP_LINK}}.',
                'Untuk informasi RTP yang paling akurat dan terkini, silakan kunjungi halaman RTP kami: {{RTP_LINK}}.',
                'Untuk membantu Anda membuat keputusan yang tepat, Anda dapat menemukan informasi RTP waktu nyata kami di tautan berikut: {{RTP_LINK}}.',
            ],
            // deposit flow default templates (editable per-group)
            'depositFlow' => [
                'askUsername' => 'Bos, boleh minta UserID akun kamu dulu? 1 kata saja (tanpa spasi), biar aku bisa bantu cek semua lebih gampang 🙏',
                'askProof' => 'Sekarang kirim bukti transfer (screenshot struk/bukti deposit) yang jelas supaya bisa dicek otomatis ke sistem ya. 🙏',
                'proofMissing' => 'Aku belum lihat bukti transfernya nih bos. Kirim screenshot struk/bukti deposit yang jelas (nominal dan rekening terlihat), nanti aku bantu cek otomatis ya. 🙏',
                'checking' => 'Bukti deposit kamu lagi dicek ke sistem ya bos, mohon tunggu sebentar. Nanti kalau sudah ada hasil aku kabari. 🙏',
                'doneResolved' => 'Oke bosku, bukti deposit kamu sudah terdeteksi dan cocok di sistem. Biasanya sebentar lagi saldo akan masuk, kalau masih belum juga kabari aku lagi ya. 🙏',
                'doneUnresolved' => 'Dari hasil cek otomatis, bukti deposit ini belum ketemu jelas di sistem. Aku teruskan ke tim CS supaya dicek manual ya, mohon tunggu sebentar dan jangan kirim deposit baru dulu. 🙏',
            ],
        ];
    }

    protected function getAvailableFlows(): array
    {
        return $this->flowQuery($this->currentGroupId ?? null)
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    protected ?int $currentGroupId = null;

    protected function flowQuery(?int $groupId)
    {
        return AiAgentFlow::query()->when($groupId, function ($query) use ($groupId) {
            $query->where(function ($inner) use ($groupId) {
                $inner->whereNull('group_id')->orWhere('group_id', $groupId);
            });
        });
    }

    protected function flowRule(int $groupId): Exists
    {
        $rule = new Exists('ai_agent_flows', 'id');
        $rule->where(
            fn($query) => $query->whereNull('group_id')->orWhere('group_id', $groupId),
        );

        return $rule;
    }

    protected function stripNulls(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->stripNulls($value);
                if ($data[$key] === []) {
                    unset($data[$key]);
                }
                continue;
            }

            if ($value === null) {
                unset($data[$key]);
            }
        }

        return $data;
    }
}
