<?php

namespace App\Features\Whatsapp\Http\Controllers;

use App\Features\Whatsapp\Application\Services\WhatsappMessageService;
use App\Features\Whatsapp\Domain\DTO\OutgoingMessage;
use App\Features\Whatsapp\Http\Requests\SendWhatsappMessageRequest;
use Common\Core\BaseController;

class WhatsappMessageController extends BaseController
{
    public function send(
        SendWhatsappMessageRequest $request,
        WhatsappMessageService $service,
    ) {
        try {
            $message = $service->sendMessage(
                OutgoingMessage::fromArray($request->validated()),
            );
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), [], 502);
        }

        return $this->success(['message' => $message]);
    }
}
