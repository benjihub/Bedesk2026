<?php namespace App\Triggers\Requests;

use Common\Core\BaseFormRequest;
use Illuminate\Validation\Rule;

class ModifyTrigger extends BaseFormRequest
{
    public function messages(): array
    {
        return [
            'conditions.required' => __(
                'Trigger must have at least one condition.',
            ),
            'conditions.*.value.required' => __(
                "Condition value field can't be empty.",
            ),
            'actions.required' => __(
                'Trigger must have at least one action.',
            ),
            'actions.*.value.required' => __(
                "Action value field can't be empty.",
            ),
        ];
    }

    public function rules(): array
    {
        $trigger = $this->route('trigger');

        return [
            'name' => [
                'required',
                'min:1',
                'max:250',
                Rule::unique('triggers')->ignore($trigger?->id),
            ],
            'description' => 'nullable|max:250',
            'conditions' => 'required|array',
            'conditions.*.name' => 'required|string',
            'conditions.*.operator' => 'required|string',
            'conditions.*.match_type' => 'required|in:any,all',
            'conditions.*.value' => 'required',
            'actions' => 'required|array',
            'actions.*.name' => 'required|string',
            'actions.*.value' => 'present|array',
            'actions.*.value.*' => 'required|min:1',
        ];
    }
}
