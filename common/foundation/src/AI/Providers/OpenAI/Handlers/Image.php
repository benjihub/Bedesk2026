<?php

namespace Common\AI\Providers\OpenAI\Handlers;

use Common\AI\Images\GenerateImageResponse;
use Common\AI\Providers\OpenAI\Concerns\BuildsClient;
use Common\AI\TokenUsage;

class Image
{
    use BuildsClient;

    public function generate(
        string $prompt,
        array $data,
        string|null $model = null,
    ): GenerateImageResponse {
        $response = $this->getClient()
            ->images()
            ->create([
                'model' => $model ?? 'dall-e-3',
                'prompt' => $prompt,
                'n' => 1,
                'size' => $data['size'] ?? '1024x1024',
                'metadata' => [
                    'app_name' => config('app.name'),
                ],
                'response_format' => 'url',
            ]);

        return new GenerateImageResponse(
            url: $response->data[0]->url,
            size: $data['size'] ?? '1024x1024',
            revisedPrompt: $response->data[0]->revisedPrompt,
            usage: new TokenUsage(1),
        );
    }
}
