<?php namespace Livechat\Controllers;

use Illuminate\Broadcasting\BroadcastController as BaseBroadcastController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;


class WidgetBroadcastController extends BaseBroadcastController
{
    public function authenticate(Request $request)
    {
        // allow both sanctum auth and widget header based auth (for cross-site iframe)
        if (!Auth::check()) {
            $token = $request->header('X-Widget-Auth');
            if (is_string($token) && str_contains($token, '.')) {
                [$userId, $sig] = explode('.', $token, 2);
                $userId = (int) $userId;
                $secret = config('app.widget_hmac_secret') ?: config('app.key');
                if ($userId > 0 && is_string($secret)) {
                    $expected = hash_hmac('sha256', (string) $userId, $secret);
                    if (hash_equals($expected, (string) $sig)) {
                        if ($user = User::find($userId)) {
                            // set the current user for this request
                            Auth::login($user);
                        }
                    }
                }
            }
        }

        try {
            return parent::authenticate($request);
        } catch (\Throwable $e) {
            // avoid 500s during widget broadcast auth; log and return 403
            Log::error('Widget broadcasting auth failed', [
                'error' => $e->getMessage(),
                'trace' => substr($e->getTraceAsString(), 0, 1000),
                'user_id' => Auth::id(),
                'ip' => $request->ip(),
                'channel_name' => $request->input('channel_name'),
            ]);

            return response()->json([
                'message' => 'Broadcast auth failed',
            ], 403);
        }
    }
}