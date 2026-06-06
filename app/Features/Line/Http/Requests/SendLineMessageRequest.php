<?php

namespace App\Features\Line\Http\Requests;

use Common\Core\BaseFormRequest;

class SendLineMessageRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'to' => 'required|string',
            'type' => 'required|string|in:text,image',
            'body' => 'required_if:type,text|nullable|string|max:4096',
            'original_content_url' => 'required_if:type,image|nullable|url|max:2048',
            'preview_image_url' => 'required_if:type,image|nullable|url|max:2048',
            'account_id' => 'nullable|integer|exists:line_accounts,id',
        ];
    }
}
