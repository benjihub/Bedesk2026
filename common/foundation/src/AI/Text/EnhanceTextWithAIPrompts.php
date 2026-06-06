<?php

namespace Common\AI\Text;

class EnhanceTextWithAIPrompts
{
    public static function get(array $data): array
    {
        return [
            'system' => self::getSystemPrompt($data['instruction']),
            'user' => self::getUserPrompt($data),
        ];
    }

    protected static function getUserPrompt(array $data): string
    {
        if ($data['instruction'] === 'translate') {
            return "Translate the following text to {$data['language']}: {$data['text']}";
        } elseif ($data['instruction'] === 'changeTone') {
            $instruction = match ($data['tone']) {
                'casual' => 'Change the tone of the following text to casual: ',
                'formal' => 'Change the tone of the following text to formal: ',
                'confident'
                    => 'Change the tone of the following text to confident: ',
                'friendly'
                    => 'Change the tone of the following text to friendly: ',
                'inspirational'
                    => 'Change the tone of the following text to inspirational: ',
                'motivational'
                    => 'Change the tone of the following text to motivational: ',
                'nostalgic'
                    => 'Change the tone of the following text to nostalgic: ',
                'professional'
                    => 'Change the tone of the following text to professional: ',
                'playful'
                    => 'Change the tone of the following text to playful: ',
                'scientific'
                    => 'Change the tone of the following text to scientific: ',
                'witty' => 'Change the tone of the following text to witty: ',
                'straightforward'
                    => 'Change the tone of the following text to straightforward: ',
            };
            return $instruction . $data['text'];
        } else {
            $instruction = match ($data['instruction']) {
                'simplify' => 'Simplify the following text: ',
                'shorten' => 'Shorten the following text: ',
                'lengthen' => 'make the following text longer: ',
                'fixSpelling'
                    => 'Fix spelling and grammar of the following text: ',
            };
            return $instruction . $data['text'];
        }
    }

    protected static function getSystemPrompt(string $instruction): string
    {
        if ($instruction === 'translate') {
            return 'Translate given text to the specified language. Only translate the text, do not add any additional information or context. If you are not able to translate the text for any reason, return only the original text.';
        } elseif ($instruction === 'changeTone') {
            return 'Change the tone of given text following specified instructions. Only change the tone of the text, do not add any additional information or context. If you are not able to change the tone of the text for any reason, return only the original text.';
        } else {
            $instruction = match ($instruction) {
                'simplify' => 'Simplify the text provided by user.',
                'shorten' => 'Shorten the text provided by user.',
                'lengthen' => 'Lengthen the text provided by user.',
                'fixSpelling'
                    => 'Fix spelling and grammar of the text provided by user.',
            };

            return $instruction .
                ' If you are not able to refine the text for any reason, return only the original text.';
        }
    }
}
