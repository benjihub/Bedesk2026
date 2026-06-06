<?php

namespace Common\AI\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnhanceTextRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'text' => 'required|string|min:20|max:1000',
            'instruction' =>
                'required|string|in:simplify,shorten,lengthen,fixSpelling,changeTone,translate',
            'tone' => 'required_if:instruction,changeTone|string',
            'language' => 'required_if:instruction,translate|string',
        ];
    }
}
