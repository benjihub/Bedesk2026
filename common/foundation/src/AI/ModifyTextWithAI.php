<?php

namespace Common\AI;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Validation\ValidatesRequests;
use OpenAI;

class ModifyTextWithAI
{
    use ValidatesRequests;

    public function execute(): array
    {
        $data = $this->validate(request(), [
            'text' => 'required|string|min:20|max:1000',
            'instruction' =>
                'required|string|in:simplify,shorten,lengthen,fixSpelling,changeTone,translate',
            'tone' => 'required_if:instruction,changeTone|string',
            'language' => 'required_if:instruction,translate|string',
        ]);

        $client = OpenAI::client(config('services.openai.api_key'));

        if ($data['instruction'] === 'translate') {
            $instruction = "Translate the following text to {$data['language']}";
        } elseif ($data['instruction'] === 'changeTone') {
            $instruction = match ($data['tone']) {
                'casual' => 'Change the tone of the following text to casual',
                'formal' => 'Change the tone of the following text to formal',
                'confident'
                    => 'Change the tone of the following text to confident',
                'friendly'
                    => 'Change the tone of the following text to friendly',
                'inspirational'
                    => 'Change the tone of the following text to inspirational',
                'motivational'
                    => 'Change the tone of the following text to motivational',
                'nostalgic'
                    => 'Change the tone of the following text to nostalgic',
                'professional'
                    => 'Change the tone of the following text to professional',
                'playful' => 'Change the tone of the following text to playful',
                'scientific'
                    => 'Change the tone of the following text to scientific',
                'witty' => 'Change the tone of the following text to witty',
                'straightforward'
                    => 'Change the tone of the following text to straightforward',
                default => '',
            };
        } else {
            $instruction = match ($data['instruction']) {
                'simplify' => 'Simplify the following text',
                'shorten' => 'Shorten the following text',
                'lengthen' => 'make the following text longer',
                'fixSpelling'
                    => 'Fix spelling and grammar of the following text',
                default => '',
            };
        }

        if (!$instruction) {
            return $data['text'];
        }

        $additionalInstruction =
            'If you are not able to refine the text for any reason, return only the original text.';

        $prompt = "{$instruction}. $additionalInstruction:  {$data['text']}";

        try {
            $apiResponse = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'temperature' => 0.7,
                'max_tokens' => 2000,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' =>
                            'You are a bot helping user refine their reply to customer. You will not reply in conversational language, you will only provide the refined text or original text if you are not able to refine it. You will not provide any additional information, context, apologies introductions or add any prefixes or explanations to the text. You will only refine the text and return it.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);
        } catch (OpenAI\Exceptions\ErrorException $e) {
            if ($e->getErrorType() === 'insufficient_quota') {
                throw new AuthorizationException(
                    __('policies.ai_quota_exceeded'),
                );
            }
        }

        return [
            'tokens' => $apiResponse->usage->totalTokens,
            'text' => $apiResponse->choices[0]->message->content,
            'prompt' => $prompt,
        ];
    }
}
