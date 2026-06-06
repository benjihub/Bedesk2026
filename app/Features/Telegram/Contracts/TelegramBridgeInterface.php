<?php

namespace App\Features\Telegram\Contracts;

interface TelegramBridgeInterface
{
    /**
     * Bridge method called when a message is received from Telegram.
     *
     * @param array $update
     * @return void
     */
    public function dispatch(array $update): void;
}
