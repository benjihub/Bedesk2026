<?php

namespace App\Attributes\Controllers;

use App\Attributes\Models\CustomAttribute;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AttributesController extends BaseController
{
    public function index()
    {
        $this->authorize('index', CustomAttribute::class);

        $datasource = new Datasource(
            CustomAttribute::query()->withoutGlobalScope('active'),
            request()->all(),
        );
        $pagination = $datasource->paginate();

        return $this->success(['pagination' => $pagination]);
    }

    public function show(int $attributeId)
    {
        $attribute = CustomAttribute::query()
            ->withoutGlobalScope('active')
            ->findOrFail($attributeId);

        $this->authorize('show', $attribute);

        return $this->success(['attribute' => $attribute]);
    }

    public function store()
    {
        $this->authorize('store', CustomAttribute::class);

        $validator = Validator::make(request()->all(), [
            'name' => [
                'required',
                'string',
                'max:60',
                Rule::unique('attributes', 'name'),
            ],
            'type' => ['required', 'string'],
            'required' => 'boolean',
            'format' => ['required', 'string', 'max:50'],
            'description' => 'string|max:600|nullable',
            'customer_name' => 'string|max:60|nullable',
            'customer_description' => 'string|max:300|nullable',
            'permission' => 'required|string',
            'config' => 'array|nullable',
        ]);

        $validator->after($this->getCrupdateAfterCallback());

        $data = $validator->validate();

        $data['key'] = slugify($data['name'], '_');

        $attribute = CustomAttribute::create($data);

        return $this->success(['attribute' => $attribute]);
    }

    public function update(int $attributeId)
    {
        $attribute = CustomAttribute::query()
            ->withoutGlobalScope('active')
            ->findOrFail($attributeId);

        $rules = [
            'name' => [
                'string',
                'max:60',
                Rule::unique('attributes', 'name')->ignore($attribute->id),
            ],
            'type' => ['string'],
            'format' => ['string', 'max:50'],
            'required' => 'boolean',
            'description' => 'string|max:600|nullable',
            'customer_name' => 'string|max:60|nullable',
            'customer_description' => 'string|max:300|nullable',
            'permission' => 'string',
            'config' => 'array|nullable',
            'active' => 'boolean',
        ];

        if (!$attribute->internal) {
            $rules['required'] = ['boolean'];
            $rules['permission'] = ['string', 'max:50'];
            $rules['active'] = ['boolean'];
        }

        $validator = Validator::make(request()->all(), $rules);

        $validator->after($this->getCrupdateAfterCallback());

        $data = $validator->validate();

        $this->authorize('update', $attribute);

        $attribute->update($data);

        return $this->success(['attribute' => $attribute]);
    }

    public function destroy(int $attributeId)
    {
        $attribute = CustomAttribute::query()
            ->withoutGlobalScope('active')
            ->findOrFail($attributeId);

        $this->authorize('destroy', $attribute);
        $this->blockOnDemoSite();

        $attribute->delete();

        return $this->success();
    }

    public function list()
    {
        $labelsFor = request('labelsFor', 'customer');
        $attributeIds = request('attributeIds')
            ? explode(',', request('attributeIds'))
            : null;
        $permission = request('permission');
        $type = request('type');
        $showInternal = request('showInternal');

        $attributes = CustomAttribute::query()
            ->when($attributeIds, fn($q) => $q->whereIn('id', $attributeIds))
            ->when($permission, fn($q) => $q->where('permission', $permission))
            ->when($type, fn($q) => $q->where('type', $type))
            ->when(
                !$showInternal && !$attributeIds,
                fn($q) => $q->where('internal', false),
            )
            ->where('active', true)
            ->orderByRaw('internal = 1 desc')
            ->orderByDesc('updated_at')
            ->get()
            ->map(
                fn(CustomAttribute $attributes) => $attributes->toCompactArray(
                    $labelsFor,
                ),
            );

        return $this->success(['attributes' => $attributes]);
    }

    protected function getCrupdateAfterCallback()
    {
        return function ($validator) {
            $options = request('config.options') ?? null;

            if ($options) {
                $names = array_column($options, 'name');
                $values = array_column($options, 'value');

                $uniqueNames = array_unique($names);
                $uniqueValues = array_unique($values);

                if (
                    count($uniqueNames) !== count($names) ||
                    count($uniqueValues) !== count($values)
                ) {
                    $validator
                        ->errors()
                        ->add(
                            'config.options',
                            __(
                                'Name and value for each option needs to be unique.',
                            ),
                        );
                }
            }
        };
    }
}
