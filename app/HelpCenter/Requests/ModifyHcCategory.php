<?php namespace App\HelpCenter\Requests;

use Common\Core\BaseFormRequest;

class ModifyHcCategory extends BaseFormRequest
{
    public function rules(): array
    {
        $rules = [
            'name' => 'string|min:2|max:250',
            'image' => 'string|nullable',
            'parent_id' => 'integer|nullable',
            'description' => 'min:2|nullable',
            'visible_to_role' => 'int|nullable',
            'managed_by_role' => 'int|nullable',
            'hide_from_structure' => 'boolean|nullable',
        ];

        if ($this->method() === 'POST') {
            $rules['name'] = 'required|' . $rules['name'];
        }

        return $rules;
    }
}
