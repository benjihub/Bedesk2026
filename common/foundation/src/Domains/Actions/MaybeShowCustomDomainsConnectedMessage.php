<?php

namespace Common\Domains\Actions;

use Common\Core\AppUrl;
use Common\Domains\CustomDomainController;
use Symfony\Component\HttpFoundation\Response;

class MaybeShowCustomDomainsConnectedMessage
{
    public function execute(): Response|false
    {
        // allow validating custom domain
        if (
            request()->path() ===
            CustomDomainController::VALIDATE_CUSTOM_DOMAIN_PATH
        ) {
            return false;
        }

        if (
            config('app.enable_custom_domains') &&
            config('app.installed') &&
            !app(AppUrl::class)->envAndCurrentHostsAreEqual
        ) {
            $message = app(AppUrl::class)->matchedCustomDomain
                ? __(
                    'Custom domain connected successfully. You can manage it from your dashboard.',
                )
                : __(
                    'Custom domain DNS records configured properly. You can now connect this domain from your dashboard.',
                );

            return response()->view(
                'common::domains/domain-connected-message',
                ['message' => $message],
            );
        }

        return false;
    }
}
