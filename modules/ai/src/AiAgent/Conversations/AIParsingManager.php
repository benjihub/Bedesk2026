<?php

namespace Ai\AiAgent\Conversations;

class AIParsingManager
{
    public function tryParseJson(string $raw): ?array
    {
        $trimmed = trim($this->stripMarkdownCodeFences($raw));
        if ($trimmed === '') return null;

        try {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) return $decoded;
        } catch (\Throwable $e) {
            // ignore
        }

        // If there is extra text around the JSON (including trailing ```),
        // extract the innermost JSON object/array substring.
        $objStart = strpos($trimmed, '{');
        $objEnd = strrpos($trimmed, '}');
        if ($objStart !== false && $objEnd !== false && $objEnd > $objStart) {
            $candidate = substr($trimmed, $objStart, $objEnd - $objStart + 1);
            $candidate = trim($candidate);
            try {
                $decoded = json_decode($candidate, true);
                if (is_array($decoded)) return $decoded;
            } catch (\Throwable $e) {
                // ignore
            }
        }

        $arrStart = strpos($trimmed, '[');
        $arrEnd = strrpos($trimmed, ']');
        if ($arrStart !== false && $arrEnd !== false && $arrEnd > $arrStart) {
            $candidate = substr($trimmed, $arrStart, $arrEnd - $arrStart + 1);
            $candidate = trim($candidate);
            try {
                $decoded = json_decode($candidate, true);
                if (is_array($decoded)) return $decoded;
            } catch (\Throwable $e) {
                // ignore
            }
        }

        if (preg_match('/\{[\s\S]*\}$/', $trimmed, $m)) {
            try {
                $decoded = json_decode($m[0], true);
                if (is_array($decoded)) return $decoded;
            } catch (\Throwable $e) {
                // ignore
            }
        }

        return null;
    }

    public function stripMarkdownCodeFences(string $text): string
    {
        $t = trim($text);
        if ($t === '') return '';

        if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', $t, $m)) {
            return trim((string) ($m[1] ?? ''));
        }

        return $text;
    }

    public function looksLikeJsonEnvelope(string $text): bool
    {
        $t = trim($text);
        if ($t === '') return false;

        // Strong indicator: JSON schema keys present together.
        $hasReply = (bool) preg_match('/"reply"\s*:/', $t);
        $hasIntentOrContext = (bool) preg_match('/"intent"\s*:|"context"\s*:/', $t);

        // If it starts like JSON (or was code-fenced before stripping), treat it as envelope.
        $startsLikeJson = str_starts_with($t, '{') || str_starts_with($t, '[');

        return $startsLikeJson && $hasReply && $hasIntentOrContext;
    }
}
