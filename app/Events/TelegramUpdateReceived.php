<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TelegramUpdateReceived
{
    use Dispatchable, SerializesModels;

    public array $update;

    public function __construct(array $update)
    {
        $this->update = $update;
    }
}
