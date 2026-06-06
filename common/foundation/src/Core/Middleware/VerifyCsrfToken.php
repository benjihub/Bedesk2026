<?php

namespace Common\Core\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as LaravelVerifyCsrfToken;
use Illuminate\Http\Request;

class VerifyCsrfToken extends LaravelVerifyCsrfToken
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'auth/login',
        'auth/register',
        '*broadcasting/auth',
        'search-term',
        '*/visits/*/change-status',
        // widget API - public endpoints used by customer-facing widget
        'api/v1/lc/widget/*',
        'lc/widget/*',
        'api/v1/helpdesk/customer/conversations/*/mark-as-solved',
        // LINE webhook endpoints
        'api/line/webhook',
        'api/line/messages',
    ];

    /**
     * Determine if the request has a URI/Domain that should pass through CSRF verification.
     *
     * @param  Request  $request
     * @return bool
     */
    protected function inExceptArray($request)
    {
        if (config('app.disable_csrf')) {
            return true;
        }

        // Widget uploads can be performed from embedded/cross-site contexts where
        // session cookies (and therefore CSRF tokens) may be unavailable or mismatched.
        // Only bypass CSRF for upload endpoints when request is explicitly marked as
        // coming from widget and includes widget auth credentials.
        if (
            $this->isWidgetUploadRequest($request) &&
            ($request->header('X-Widget-Auth') || $request->get('_widget_auth'))
        ) {
            return true;
        }

        return parent::inExceptArray($request);
    }

    protected function isWidgetUploadRequest(Request $request): bool
    {
        $isWidgetRequest =
            $request->header('X-Chat-Widget') === 'true' ||
            $request->get('_xChatWidget') === 'true';

        if (!$isWidgetRequest) {
            return false;
        }

        return
            $request->is('api/v1/file-entries') ||
            $request->is('api/v1/file-entries/*') ||
            $request->is('api/v1/tus/entries') ||
            $request->is('api/v1/tus/upload/*') ||
            $request->is('api/v1/s3/simple/presign') ||
            $request->is('api/v1/s3/entries') ||
            $request->is('api/v1/s3/multipart/*');
    }

    protected function addCookieToResponse($request, $response)
    {
        // don't add cookie if session is set to null
        // (belink needs to disable laravel headers for 301 redirect)
        if (config('session.driver') === null) {
            return $response;
        }

        return parent::addCookieToResponse($request, $response);
    }
}
