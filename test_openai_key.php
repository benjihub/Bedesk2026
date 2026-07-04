<?php
/**
 * Test script to validate OpenAI API key.
 * Run: php test_openai_key.php
 */

require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Get API key and model from env
$apiKey = env('OPENAI_API_KEY');
$model = env('OPENAI_TEXT_MODEL') ?? env('OPENAI_MODEL') ?? 'gpt-4o-mini';

if (!$apiKey) {
    echo "❌ ERROR: OPENAI_API_KEY is not set in .env\n";
    exit(1);
}

echo "🔍 Testing OpenAI API key...\n";
echo "API Key (first 20 chars): " . substr($apiKey, 0, 20) . "...\n";
echo "Model: " . $model . "\n\n";

try {
    $client = new \GuzzleHttp\Client(['timeout' => 30]);
    
    echo "Sending test request to OpenAI API...\n";
    
    $resp = $client->post('https://api.openai.com/v1/chat/completions', [
        'headers' => [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ],
        'json' => [
            'model' => $model,
            'messages' => [
                ['role' => 'user', 'content' => 'Say "OK" if you can read this.'],
            ],
            'max_tokens' => 10,
            'temperature' => 0.0,
        ],
    ]);

    $body = json_decode((string) $resp->getBody(), true);
    
    if (isset($body['error'])) {
        echo "❌ ERROR: API returned error\n";
        echo "Error code: " . ($body['error']['code'] ?? 'unknown') . "\n";
        echo "Error message: " . ($body['error']['message'] ?? 'unknown') . "\n";
        exit(1);
    }

    $content = $body['choices'][0]['message']['content'] ?? null;
    
    if (!$content) {
        echo "❌ ERROR: No response content received\n";
        exit(1);
    }
    
    echo "✅ SUCCESS: API key is valid!\n";
    echo "Response: " . trim($content) . "\n";
    echo "Model used: " . ($body['model'] ?? $model) . "\n";
    echo "Tokens - Prompt: " . ($body['usage']['prompt_tokens'] ?? 0) . ", Completion: " . ($body['usage']['completion_tokens'] ?? 0) . "\n";
    
    exit(0);
    
} catch (\GuzzleHttp\Exception\ClientException $e) {
    $statusCode = $e->getResponse()->getStatusCode();
    $body = json_decode((string) $e->getResponse()->getBody(), true);
    
    echo "❌ ERROR: HTTP " . $statusCode . "\n";
    
    if ($statusCode === 401) {
        echo "Invalid or expired API key\n";
    }
    
    echo "Details: " . ($body['error']['message'] ?? $e->getMessage()) . "\n";
    exit(1);
    
} catch (\Throwable $e) {
    echo "❌ ERROR: " . get_class($e) . "\n";
    echo "Message: " . $e->getMessage() . "\n";
    exit(1);
}
