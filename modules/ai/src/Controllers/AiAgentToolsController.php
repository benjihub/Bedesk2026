<?php

namespace Ai\Controllers;

use Ai\AiAgent\Models\AiAgentTool;
use Common\Core\BaseController;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Throwable;

class AiAgentToolsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('ai_agent.update');

        $perPage = $request->get('perPage', 15);
        $tools = $this->scopedQuery($request)
            ->orderByDesc('id')
            ->paginate($perPage);

        return $this->success([
            'pagination' => $tools,
        ]);
    }

    public function show(Request $request, int $id)
    {
        $this->authorize('ai_agent.update');

        $tool = $this->scopedQuery($request)->find($id);
        if (!$tool) {
            return $this->error('Tool not found', [], 404);
        }

        return $this->success(['tool' => $tool]);
    }

    public function store(Request $request)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, $this->toolRules());

        $tool = new AiAgentTool();
        $this->fillToolFromPayload($tool, $request, $data);
        $tool->group_id = $this->resolveGroupId($request);
        $tool->save();

        return $this->success(['tool' => $tool], 201);
    }

    public function update(Request $request, int $id)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, $this->toolRules());

        $tool = $this->scopedQuery($request)->findOrFail($id);
        $this->fillToolFromPayload($tool, $request, $data);
        $tool->group_id = $this->resolveGroupId($request) ?? $tool->group_id;
        $tool->save();

        return $this->success(['tool' => $tool]);
    }

    public function destroy(string $ids)
    {
        $this->authorize('ai_agent.update');

        $this->scopedQuery(request())->whereIn('id', explode(',', $ids))->delete();

        return $this->success([], 204);
    }

    /**
     * Get list of tools for dropdown/selection purposes
     */
    public function list(Request $request)
    {
        $this->authorize('ai_agent.update');

        $tools = $this->scopedQuery($request)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return $this->success([
            'tools' => $tools,
        ]);
    }

    public function testRequest(Request $request)
    {
        $this->authorize('ai_agent.update');

        $data = $this->validate($request, [
            'apiRequest' => 'required|array',
            'apiRequest.url' => 'required|string',
            'apiRequest.method' => 'required|string|in:GET,POST,PUT,DELETE,PATCH',
            'apiRequest.headers' => 'nullable|array',
            'apiRequest.bodyType' => 'nullable|in:json,text',
            'apiRequest.body' => 'nullable|string',
            'attributes' => 'nullable|array',
            'attributes.*.name' => 'required|string',
            'attributes.*.type' => 'nullable|string',
            'attributes.*.value' => 'nullable|string',
        ]);

        $attributes = collect($data['attributes'] ?? [])->mapWithKeys(function (array $attribute) {
            return [$attribute['name'] => $attribute['value'] ?? ''];
        })->all();

        $url = $this->renderTemplate($data['apiRequest']['url'], $attributes);
        $headers = collect($data['apiRequest']['headers'] ?? [])
            ->mapWithKeys(function (array $header) use ($attributes) {
                return [
                    $this->renderTemplate((string) ($header['key'] ?? ''), $attributes) =>
                        $this->renderTemplate((string) ($header['value'] ?? ''), $attributes),
                ];
            })
            ->filter(fn($value, $key) => $key !== '')
            ->all();

        $body = $this->renderTemplate((string) ($data['apiRequest']['body'] ?? ''), $attributes);
        $method = strtoupper($data['apiRequest']['method']);

        try {
            $client = new Client([
                'timeout' => 30,
            ]);

            $options = ['headers' => $headers];
            if ($body !== '' && $method !== 'GET') {
                $options['body'] = $body;
                if (($data['apiRequest']['bodyType'] ?? 'json') === 'json') {
                    $options['headers']['Content-Type'] ??= 'application/json';
                }
            }

            $response = $client->request($method, $url, $options);
            $contents = (string) $response->getBody();
            $parsed = json_decode($contents, true);
            $bodyValue = json_last_error() === JSON_ERROR_NONE ? $parsed : $contents;

            return $this->success([
                'response' => $bodyValue,
                'status' => $response->getStatusCode(),
                'headers' => $response->getHeaders(),
            ]);
        } catch (Throwable $e) {
            return $this->error($e->getMessage(), [], 422);
        }
    }

    protected function toolRules(): array
    {
        return [
            'groupId' => 'sometimes|nullable|integer|exists:groups,id',
            'step' => 'sometimes|string',
            'name' => 'sometimes|nullable|string|min:2|max:255',
            'description' => 'sometimes|nullable|string',
            'active' => 'sometimes|boolean',
            'allow_direct_use' => 'sometimes|boolean',
            'type' => 'sometimes|nullable|string|max:255',
            'selectedResponseType' => 'sometimes|in:live,example',
            'url' => 'sometimes|nullable|string',
            'method' => 'sometimes|nullable|string|max:10',
            'headers' => 'sometimes|array',
            'bodyType' => 'sometimes|nullable|in:json,text',
            'body' => 'sometimes|nullable|string',
            'collectedData' => 'sometimes|array',
            'attributesUsed' => 'sometimes|array',
            'liveResponse' => 'sometimes|nullable|string',
            'exampleResponse' => 'sometimes|nullable|string',
            'responseSchema' => 'sometimes|array',
        ];
    }

    protected function scopedQuery(Request $request)
    {
        $groupId = $this->resolveGroupId($request);

        return AiAgentTool::query()->where(function ($query) use ($groupId) {
            if ($groupId) {
                $query->whereNull('group_id')->orWhere('group_id', $groupId);
                return;
            }

            $query->whereNull('group_id');
        });
    }

    protected function resolveGroupId(Request $request): ?int
    {
        $groupId = $request->input('groupId', $request->query('groupId'));

        return is_numeric($groupId) ? (int) $groupId : null;
    }

    protected function fillToolFromPayload(AiAgentTool $tool, Request $request, array $data): void
    {
        $step = $data['step'] ?? null;
        $tool->name = $data['name'] ?? $tool->name ?? '';
        $tool->description = $data['description'] ?? $tool->description ?? '';

        if (array_key_exists('active', $data)) {
            $tool->active = (bool) $data['active'];
        } elseif (!$tool->exists && !isset($tool->active)) {
            $tool->active = false;
        }
        if (array_key_exists('allow_direct_use', $data)) {
            $tool->allow_direct_use = (bool) $data['allow_direct_use'];
        } elseif (!$tool->exists && !isset($tool->allow_direct_use)) {
            $tool->allow_direct_use = false;
        }
        if (array_key_exists('type', $data)) {
            $tool->type = $data['type'];
        }

        $config = $tool->config ?? [];
        if (!is_array($config)) {
            $config = [];
        }
        $config['selectedResponseType'] = $config['selectedResponseType'] ?? 'live';
        $config['apiRequest'] = $config['apiRequest'] ?? [];
        if (!is_array($config['apiRequest'])) {
            $config['apiRequest'] = [];
        }

        if ($step === 'apiConnection') {
            $config['apiRequest'] = array_merge($config['apiRequest'], [
                'url' => $data['url'] ?? $config['apiRequest']['url'] ?? '',
                'method' => $data['method'] ?? $config['apiRequest']['method'] ?? 'GET',
                'bodyType' => $data['bodyType'] ?? $config['apiRequest']['bodyType'] ?? 'json',
                'body' => $data['body'] ?? $config['apiRequest']['body'] ?? '',
                'headers' => $data['headers'] ?? $config['apiRequest']['headers'] ?? [],
                'collectedData' => $data['collectedData'] ?? $config['apiRequest']['collectedData'] ?? [],
            ]);
        }

        if ($step === 'testResponse') {
            if (array_key_exists('selectedResponseType', $data)) {
                $config['selectedResponseType'] = $data['selectedResponseType'];
            }
            if (array_key_exists('liveResponse', $data)) {
                $tool->live_response = $data['liveResponse'];
            }
            if (array_key_exists('exampleResponse', $data)) {
                $tool->example_response = $data['exampleResponse'];
            }
            if (array_key_exists('attributesUsed', $data)) {
                $config['apiRequest']['attributesUsed'] = $data['attributesUsed'];
            }
        }

        if ($step === 'attributeMapping') {
            if (array_key_exists('responseSchema', $data)) {
                $tool->response_schema = $data['responseSchema'];
            }
        }

        $tool->config = $config;
    }

    protected function renderTemplate(string $value, array $attributes): string
    {
        return preg_replace_callback(
            '/<be-variable\s+name="([^"]+)"[^>]*><\/be-variable>/',
            function (array $matches) use ($attributes) {
                $name = $matches[1] ?? '';

                return (string) ($attributes[$name] ?? '');
            },
            $value,
        ) ?? $value;
    }
}
