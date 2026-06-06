<?php

namespace Common\Core\Middleware;

use Common\Domains\CustomDomainController;
use Illuminate\Http\Middleware\TrustHosts as Middleware;

class TrustHosts extends Middleware
{
    public function hosts(): array
    {
        if (app()->environment(['local', 'development', 'testing'])) {
            return [];
        }

        return [$this->allSubdomainsOfApplicationUrl()];
    }

    protected function shouldSpecifyTrustedHosts(): bool
    {
        // allow custom domain validation
        if (
            request()->path() ===
            CustomDomainController::VALIDATE_CUSTOM_DOMAIN_PATH
        ) {
            return false;
        } else {
            return parent::shouldSpecifyTrustedHosts();
        }
    }
}
