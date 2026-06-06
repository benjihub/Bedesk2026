<?php

namespace Livechat\Widget\Middleware;

use Closure;
use Common\Core\Rendering\CrawlerDetector;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Livechat\Widget\Users\ResolveWidgetCustomer;
use App\Models\User;

class AuthenticateWidget implements AuthenticatesRequests
{
    public const widgetCustomerKey = 'lcWidgetCustomerId';

    public function __construct(protected AuthFactory $auth) {}

    public function handle(Request $request, Closure $next, ...$guards)
    {
        $this->authenticate($request, $guards);

        return $next($request);
    }

    protected function authenticate(Request $request, array $guards)
    {
        $mainSessionUserId = Auth::id();
        config()->set('sanctum.guard', ['chatWidget']);
        config()->set('auth.defaults.guard', 'chatWidget');

        // Fallback auth for browsers that block third-party cookies inside iframe.
        // Widget can send a signed user id token via header or as a query param
        // (used by sendBeacon which cannot set custom headers).
        $token = $request->header('X-Widget-Auth') ?? $request->query('_widget_auth') ?? $request->input('_widget_auth');
        if (!$token) {
            // debug: no widget auth provided
            \Illuminate\Support\Facades\Log::warning('Widget authenticate: no X-Widget-Auth token provided', [
                'ip' => $request->ip(),
                'route' => optional($request->route())?->getName(),
            ]);
        }

        if (is_string($token) && str_contains($token, '.')) {
            [$userId, $sig] = explode('.', $token, 2);
            $userId = (int) $userId;
            $secret = config('app.widget_hmac_secret') ?: config('app.key');
            if ($userId > 0 && is_string($secret)) {
                $expected = hash_hmac('sha256', (string) $userId, $secret);
                if (hash_equals($expected, (string) $sig)) {
                    if ($user = User::find($userId)) {
                        session()->put(self::widgetCustomerKey, $user->id);
                        auth('chatWidget')->setUser($user);
                        \Illuminate\Support\Facades\Log::info('Widget authenticate: token valid, user set', [
                            'ip' => $request->ip(),
                            'user_id' => $user->id,
                            'route' => optional($request->route())?->getName(),
                        ]);
                    } else {
                        \Illuminate\Support\Facades\Log::warning('Widget authenticate: token signature valid but user not found', [
                            'ip' => $request->ip(),
                            'user_id' => $userId,
                            'route' => optional($request->route())?->getName(),
                        ]);
                    }
                } else {
                    \Illuminate\Support\Facades\Log::warning('Widget authenticate: invalid token signature', [
                        'ip' => $request->ip(),
                        'user_id' => $userId,
                        'token_prefix' => substr((string) $token, 0, 12),
                        'route' => optional($request->route())?->getName(),
                    ]);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('Widget authenticate: invalid widget secret or user id', [
                    'ip' => $request->ip(),
                    'user_id' => $userId,
                    'route' => optional($request->route())?->getName(),
                ]);
            }
        }

        if ((new CrawlerDetector())->isCrawler()) {
            $this->unauthenticated();
            return;
        }

        (new ResolveWidgetCustomer())->execute($mainSessionUserId);

        if (!auth('chatWidget')->check()) {
            // Instead of aborting unauthenticated (401), fall back to a synthetic
            // guest user so broadcasting auth can proceed and the widget can
            // receive conversation events. The guest id is derived from session
            // id to make it unique and avoid collisions with real user ids.
            $sessionId = session()->getId() ?? (string) Str::uuid();
            // Prefer a persistent visitor id provided by loader/widget, so the
            // same anonymous customer maps to the same backend user across reloads.
            $visitorId = $request->header('X-Widget-Visitor') ?? $request->query('visitorId');
            $guestKey = is_string($visitorId) && strlen($visitorId) > 0 ? (string) $visitorId : (string) $sessionId;
            $guestId = -abs(crc32($guestKey));

            $guest = new User();
            $guest->id = $guestId;
            $guest->username = 'widget_guest_' . substr($sessionId, 0, 8);
            // ensure guest role permissions
            $guest->setRelation('roles', collect([app('guestRole')]));

            auth('chatWidget')->setUser($guest);
            session()->put(self::widgetCustomerKey, $guest->id);

            \Illuminate\Support\Facades\Log::info('Widget authenticate: fallback guest user set for broadcasting', [
                'ip' => $request->ip(),
                'guest_id' => $guest->id,
                'session_id' => $sessionId,
                'visitor_id' => $visitorId,
            ]);
        }

        $user = auth('chatWidget')->user();

        if (!$user->relationLoaded('roles') || $user->roles->isEmpty()) {
            // make sure guest role permissions are inherited
            $user->setRelation('roles', collect([app('guestRole')]));
        }
    }

    protected function unauthenticated()
    {
        abort(401);
    }
}
