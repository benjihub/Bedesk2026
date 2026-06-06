<?php

namespace App\Features\Line\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use App\Features\Line\Application\Services\LineWebhookService;
use Illuminate\Support\Facades\Log;

class LineWebhookController extends Controller
{
    public function verify(Request $request): Response
    {
        return response('LINE webhook verification stub', 200);
    }

    public function handle(Request $request): JsonResponse
    {
        $service = app(LineWebhookService::class);
        $result = $service->handle($request);

        return response()->json($result);
    }
}
