<?php

namespace App\Features\Whatsapp\Http\Requests;

use Common\Core\BaseFormRequest;

class SendWhatsappMessageRequest extends BaseFormRequest
{
    public function rules(): array
    {
        return [
            'to' => 'required|string',
            'type' => 'required|string|in:text',
            'body' => 'required|string|max:4096',
            'preview_url' => 'boolean',
            'account_id' => 'nullable|integer|exists:whatsapp_accounts,id',
        ];
    }
}
