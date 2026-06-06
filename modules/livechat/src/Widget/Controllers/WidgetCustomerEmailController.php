<?php

namespace Livechat\Widget\Controllers;

use App\Conversations\Actions\ConversationEventsCreator;
use Common\Core\BaseController;
use Illuminate\Support\Facades\Auth;

class WidgetCustomerEmailController extends BaseController
{
    public function update()
    {
        $user = auth('chatWidget')->user();

        $data = request()->validate([
            'email' => 'required|email',
            'conversationid' => 'nullable|integer',
        ]);

        // we don't want to allow user to manually change or specify their primary email here,
        // because this email address is not verified
        $user->secondaryEmails()->firstOrCreate(['address' => $data['email']]);

        if (isset($data['conversationid'])) {
            $conversation = $user
                ->conversations()
                ->find($data['conversationid']);
            if ($conversation) {
                (new ConversationEventsCreator(
                    $conversation,
                ))->userEnteredEmail($data['email']);
            }
        }

        return $this->success();
    }
}
