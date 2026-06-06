<?php

namespace App\Features\Telegram\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Features\Telegram\Application\Services\TelegramMessageService;

class TelegramMessageController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $service = app(TelegramMessageService::class);
        $result = $service->send($request->all());

        return response()->json($result);
    }
}
