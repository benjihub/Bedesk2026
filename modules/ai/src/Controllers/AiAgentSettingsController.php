<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgentFlow;
use Common\Core\BaseController;
use Common\Settings\Settings;
use App\Team\Models\GroupAiAgentSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rules\Exists;

class AiAgentSettingsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.settings.update');

        $groupId = $this->resolveGroupId($request);

        return $this->success([
            'settings' => $this->getSettings($groupId),
            'flows' => $this->getAvailableFlows($groupId),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('ai_agent.settings.update');

        $data = $this->validate($request, [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'aiAgent' => 'required|array',
            'aiAgent.name' => 'required|string|min:2|max:255',
            'aiAgent.image' => 'nullable|string|max:500',
            'aiAgent.enabled' => 'sometimes|boolean',
            'aiAgent.personality' => 'nullable|string',
            'aiAgent.greetingType' => 'required|in:flow,basicGreeting',
            'aiAgent.initialFlowId' => [
                'nullable',
                'integer',
                $this->flowRule($this->resolveGroupId($request)),
            ],
            'aiAgent.basicGreeting' => 'array',
            'aiAgent.basicGreeting.message' => 'nullable|string',
            'aiAgent.basicGreeting.flowIds' => 'array',
            'aiAgent.basicGreeting.flowIds.*' => [
                'integer',
                $this->flowRule($this->resolveGroupId($request)),
            ],
            'aiAgent.transfer.type' => 'nullable|in:basicTransfer,instruction',
            'aiAgent.transfer.instruction' => 'nullable|string',
            'aiAgent.cantAssist.instruction' => 'nullable|string',
        ]);

        $groupId = $this->resolveGroupId($request);
        $settings = Arr::get($data, 'aiAgent', []);
        if (!is_array($settings)) {
            $settings = [];
        }

        // Merge recursively so partial panel updates don't reset nested keys.
        $settings = array_replace_recursive(
            $this->getDefaultSettings(),
            $this->getCurrentSettings($groupId),
            $settings,
        );

        // Normalize types for frontend expectations.
        if (!is_string(Arr::get($settings, 'personality', ''))) {
            $settings['personality'] = '';
        }

        if ($groupId) {
            $overrides = $this->stripNulls($settings);
            GroupAiAgentSettings::query()->updateOrCreate(
                ['group_id' => $groupId],
                ['overrides' => $overrides],
            );
        } else {
            app(Settings::class)->save([
                'aiAgent' => $settings,
            ]);
        }

        return $this->success([
            'settings' => $settings,
        ]);
    }

    protected function getSettings(?int $groupId = null): array
    {
        if ($groupId) {
            return $this->getCurrentSettings($groupId);
        }

        return array_merge($this->getDefaultSettings(), $this->getCurrentSettings(null));
    }

    protected function getDefaultSettings(): array
    {
        return [
            'name' => 'AI assistant',
            'image' => null,
            'enabled' => true,
            'personality' => '',
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
        ];
    }

    protected function getAvailableFlows(?int $groupId = null): array
    {
        return $this->flowQuery($groupId)
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    protected function resolveGroupId(Request $request): ?int
    {
        $groupId = $request->input('groupId', $request->query('groupId'));

        return is_numeric($groupId) ? (int) $groupId : null;
    }

    protected function flowQuery(?int $groupId)
    {
        return AiAgentFlow::query()->where(function ($query) use ($groupId) {
            if ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
                return;
            }

            $query->whereNull('group_id');
        });
    }

    protected function getCurrentSettings(?int $groupId): array
    {
        if ($groupId) {
            $record = GroupAiAgentSettings::query()
                ->where('group_id', $groupId)
                ->first();
            $current = $record?->overrides ?? [];

            if (!is_array($current)) {
                $current = [];
            }

            $global = settings('aiAgent') ?? [];
            if (!is_array($global)) {
                $global = [];
            }

            return array_replace_recursive(
                $this->getDefaultSettings(),
                $global,
                $current,
            );
        }

        $current = settings('aiAgent') ?? [];

        if (!is_array($current)) {
            $current = [];
        }

        return $current;
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

    protected function flowRule(?int $groupId): Exists
    {
        $rule = new Exists('ai_agent_flows', 'id');

        if ($groupId) {
            $rule->where(
                fn($query) => $query->whereNull('group_id')->orWhere('group_id', $groupId),
            );
        } else {
            $rule->where(fn($query) => $query->whereNull('group_id'));
        }

        return $rule;
    }
}
