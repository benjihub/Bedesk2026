<?php

namespace App\Features\Line\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use App\Features\Line\Http\Requests\SendLineMessageRequest;
use App\Features\Line\Domain\DTO\OutgoingMessage;
use App\Features\Line\Application\Services\LineMessageService;

class LineMessageController extends Controller
{
    public function send(SendLineMessageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $outgoing = OutgoingMessage::fromArray($data);

        try {
            $record = app(LineMessageService::class)->sendMessage($outgoing);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'record_id' => $record->id ?? null,
        ]);
    }
}
