<?php

namespace Common\Auth\Controllers;

use Common\Auth\UserSession;
use Common\Core\BaseController;
use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class UserSessionsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $sessions = Auth::user()
            ->userSessions()
            ->orderBy('updated_at', 'desc')
            ->limit(30)
            ->get()
            ->map(function (UserSession $session) {
                $isCurrentDevice = requestIsFromFrontend()
                    ? $session->session_id === request()->session()->getId()
                    : $session->token ===
                        $this->currentTokenValue(Auth::user());

                return [
                    'id' => $session->id,
                    'country' => $session->country,
                    'city' => $session->city,
                    'platform' => $session->platform,
                    'browser' => $session->browser,
                    'ip_address' => config('app.demo')
                        ? 'Hidden on demo site'
                        : $session->ip_address,
                    'is_current_device' => $isCurrentDevice,
                    'updated_at' => $session->updated_at,
                ];
            })
            ->values();

        return $this->success(['sessions' => $sessions]);
    }

    public function LogoutOtherSessions(SessionGuard $guard)
    {
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'password' => 'required',
        ]);

        $guard->logoutOtherDevices($data['password']);

        UserSession::where('user_id', $guard->id())
            ->whereNotNull('session_id')
            ->where('session_id', '!=', request()->session()->getId())
            ->delete();

        return $this->success();
    }

    public function heartbeat()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->noContent(401);
        }

        $sessionId = request()->session()->getId();
        $token = $this->currentTokenValue($user);

        $session = UserSession::query()
            ->where('user_id', $user->id)
            ->when(
                $sessionId,
                fn($query) => $query->where('session_id', $sessionId),
                fn($query) => $query->when(
                    $token,
                    fn($inner) => $inner->where('token', $token),
                ),
            )
            ->latest('updated_at')
            ->first();

        if ($session) {
            $session->touch('updated_at');
        } else {
            UserSession::createNewOrTouchExisting($user);
        }

        return response()->noContent();
    }

    protected function currentTokenValue($user): string|null
    {
        $token = $user->currentAccessToken();

        return $token instanceof PersonalAccessToken ? $token->token : null;
    }
}
