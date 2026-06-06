<?php

namespace App\Features\Telegram\Support;

use App\Features\Telegram\Contracts\TelegramBridgeInterface;
use App\Events\TelegramUpdateReceived;

class LiveChatTelegramBridge implements TelegramBridgeInterface
{
    public function dispatch(array $update): void
    {
        event(new TelegramUpdateReceived($update));
    }
}
