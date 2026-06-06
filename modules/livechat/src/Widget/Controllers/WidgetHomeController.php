<?php

namespace Livechat\Widget\Controllers;

use Common\Core\AppUrl;
use Common\Core\BaseController;
use Illuminate\Support\Str;
use Livechat\Actions\WidgetBootstrapData;
use Symfony\Component\HttpFoundation\Cookie;

class WidgetHomeController extends BaseController
{
    public function __invoke()
    {
        $bootstrapData = new WidgetBootstrapData();
        $view = view('livechat::chat-widget')
            ->with('bootstrapData', $bootstrapData)
            ->with('htmlBaseUri', app(AppUrl::class)->htmlBaseUri);

        $trustedDomains = Str::of(settings('lc.trusted_domains'))
            ->explode(',')
            ->map(fn($domain) => trim($domain))
            ->filter()
            ->unique();

        // Normalize entries to origin-like sources (scheme://host[:port]) when
        // possible and strip any accidental paths. This ensures the
        // Content-Security-Policy `frame-ancestors` value is valid.
        $trustedDomains = $trustedDomains->map(function($domain) {
            $parts = parse_url($domain);
            if ($parts && isset($parts['scheme']) && isset($parts['host'])) {
                $port = isset($parts['port']) ? ':'.$parts['port'] : '';
                return $parts['scheme'].'://'.$parts['host'].$port;
            }

            if ($parts && isset($parts['path'])) {
                $hostPort = explode('/', $parts['path'])[0];
                return $hostPort;
            }

            return $domain;
        })->filter()->unique();

        // Always allow the app URL origin.
        $appUrlParts = parse_url(config('app.url')) ?: [];
        if (!empty($appUrlParts['scheme']) && !empty($appUrlParts['host'])) {
            $appOrigin = $appUrlParts['scheme'].'://'.$appUrlParts['host'].
                (isset($appUrlParts['port']) ? ':'.$appUrlParts['port'] : '');
            $trustedDomains->push($appOrigin);
        }

        // Also allow embedding from the request's Referer or Origin header as
        // a full origin (scheme://host[:port]) to support local dev ports.
        $referer = request()->headers->get('origin') ?? request()->headers->get('referer');
        if ($referer) {
            $refParts = parse_url($referer);
            if ($refParts && isset($refParts['scheme']) && isset($refParts['host'])) {
                $refOrigin = $refParts['scheme'].'://'.$refParts['host'].
                    (isset($refParts['port']) ? ':'.$refParts['port'] : '');
                $trustedDomains->push($refOrigin);
            }
        }

        $trustedDomains = $trustedDomains->unique()->filter()->join(' ');

        $response = response($view);

        if ($trustedDomains) {
            $response->header(
                'Content-Security-Policy',
                "frame-ancestors $trustedDomains",
            );
        }

        return $response;
    }
}
