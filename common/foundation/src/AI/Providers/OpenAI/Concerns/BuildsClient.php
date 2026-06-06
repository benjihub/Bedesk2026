<?php

namespace Common\AI\Providers\OpenAI\Concerns;

use OpenAI;
use OpenAI\Client;

trait BuildsClient
{
    protected function getClient(): Client
    {
        return OpenAI::client(config('services.openai.api_key'));
    }
}
