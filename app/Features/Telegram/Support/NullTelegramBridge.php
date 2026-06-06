<?php

namespace App\Features\Telegram\Support;

use App\Features\Telegram\Contracts\TelegramBridgeInterface;
use Illuminate\Support\Facades\Log;

class NullTelegramBridge implements TelegramBridgeInterface
{
    public function dispatch(array $update): void
    {
        Log::debug('NullTelegramBridge received update', $update);
    }
}
