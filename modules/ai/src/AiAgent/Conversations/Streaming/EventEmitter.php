<?php

namespace Ai\AiAgent\Conversations\Streaming;

/**
 * EventEmitter for streaming chat responses using Server-Sent Events (SSE).
 * This is a stub implementation - the full AI module would have more functionality.
 */
class EventEmitter
{
    protected static bool $isStreaming = false;

    /**
     * Start a streaming response
     */
    public static function startStream(): void
    {
        self::$isStreaming = true;
        
        // Flush output buffers to enable streaming
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        
        if (function_exists('ob_implicit_flush')) {
            ob_implicit_flush(true);
        }
    }

    /**
     * End the streaming response
     */
    public static function endStream(): void
    {
        if (self::$isStreaming) {
            // Frontend expects a message event with type "endStream" to stop the iterator
            self::emitMessage([
                'type' => 'endStream',
                'value' => '[END]',
            ]);
        }
        self::$isStreaming = false;
    }

    /**
     * Emit a conversation created event
     */
    public static function conversationCreated(array $data): void
    {
        // Frontend expects: {type: 'conversationCreated', data: FullWidgetConversationResponse}
        self::emitMessage([
            'type' => 'conversationCreated',
            'data' => $data,
        ]);
    }

    /**
     * Emit a message created event
     */
    public static function messageCreated(array $message): void
    {
        // Frontend expects: {type: 'messageCreated', message: ConversationMessage}
        self::emitMessage([
            'type' => 'messageCreated',
            'message' => $message,
        ]);
    }

    /**
     * Emit a typing indicator event
     */
    public static function typing(): void
    {
        // Let the client show a typing indicator
        self::emitMessage(['type' => 'typing']);
    }

    /**
     * Emit formatted HTML content for streaming
     */
    public static function formattedHtml(string $content): void
    {
        // Frontend expects: {type: 'formattedHtml', content: string}
        self::emitMessage([
            'type' => 'formattedHtml',
            'content' => $content,
        ]);
    }

    /**
     * Emit an error event
     */
    public static function error(string $message): void
    {
        // Not part of the typed frontend union, but keep shape consistent.
        self::emitMessage([
            'type' => 'error',
            'message' => $message,
        ]);
    }

    /**
     * Emit a "message" event in SSE format.
     * Format: event: message\ndata: {...}\n\n
     */
    protected static function emitMessage(array $payload): void
    {
        self::emitSseEvent('message', $payload);
    }

    protected static function emitSseEvent(string $event, array $payload): void
    {
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            $json = json_encode([
                'type' => 'error',
                'message' => 'Failed to encode SSE payload.',
            ]);
        }

        echo "event: {$event}\n";
        echo "data: {$json}\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }

    /**
     * Emit a debug event
     */
    public static function debug(string $type, array $data = []): void
    {
        $payload = [
            'type' => $type,
            'data' => $data,
        ];

        self::emitSseEvent('debug', $payload);
    }

    /**
     * Emit raw delta content for streaming AI responses
     */
    public static function delta(string $content): void
    {
        // Frontend iterator expects {delta: string}
        self::emitSseEvent('delta', ['delta' => $content]);
    }

    /**
     * Check if currently streaming
     */
    public static function isStreaming(): bool
    {
        return self::$isStreaming;
    }
}
