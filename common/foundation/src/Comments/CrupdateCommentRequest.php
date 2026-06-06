<?php

namespace Common\Comments;

use Illuminate\Support\Facades\Auth;
use Common\Core\BaseFormRequest;

class CrupdateCommentRequest extends BaseFormRequest
{
    public function rules(): array
    {
        $required = $this->getMethod() === 'POST' ? 'required' : '';
        $ignore =
            $this->getMethod() === 'PUT' ? $this->route('comment')->id : '';
        $userId = $this->route('comment')
            ? $this->route('comment')->user_id
            : Auth::id();

        return [
            'content' => 'required|string|max:1000|min:3',
        ];
    }
}
