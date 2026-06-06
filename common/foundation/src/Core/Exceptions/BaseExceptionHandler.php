<?php

namespace Common\Core\Exceptions;

use Illuminate\Session\TokenMismatchException;
use Illuminate\Contracts\Container\Container;
use Common\Billing\Models\Product;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Exceptions\Handler;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Sentry\Laravel\Integration;
use Sentry\State\Scope;
use Spatie\Ignition\Ignition;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;
use function Sentry\configureScope;

class BaseExceptionHandler extends Handler
{
    public function __construct(Container $container)
    {
        $this->internalDontReport = array_filter(
            $this->internalDontReport,
            fn($class) => $class !== TokenMismatchException::class,
        );

        parent::__construct($container);
    }

    public function render($request, Throwable $e)
    {
        $isAuthException =
            $e instanceof AuthorizationException ||
            ($e instanceof HttpException && $e->getStatusCode() === 403);

        if (
            $isAuthException &&
            (requestIsFromFrontend() &&
                !$request->expectsJson() &&
                !Auth::check())
        ) {
            return redirect('/login');
        }

        if (
            $e instanceof AuthorizationException &&
            $e->response() instanceof AccessResponseWithPermission &&
            $e->response()->permission &&
            Auth::check() &&
            settings('billing.enable')
        ) {
            $permissionExistsInSubscriptionPlan = Product::with(['permissions'])
                ->get()
                ->some(function ($product) use ($e) {
                    // check if there's a plan that has this permission and if user is not already on this plan
                    return $product->permissions->contains(
                        'name',
                        $e->response()->permission,
                    ) &&
                        Auth::user()->subscriptions->first()?->product_id !==
                            $product->id;
                });
            if ($permissionExistsInSubscriptionPlan) {
                return Auth::user()->subscribed()
                    ? redirect('/billing')
                    : redirect('/pricing');
            }
        }

        return parent::render($request, $e);
    }

    public function register()
    {
        if (config('app.env') !== 'production') {
            return;
        }

        configureScope(function (Scope $scope): void {
            $scope->setContext('app_name', ['value' => config('app.name')]);
        });

        $this->reportable(function (Throwable $e) {
            Integration::captureUnhandledException($e);
        });
    }

    protected function convertExceptionToArray(Throwable $e): array
    {
        $previous = $e->getPrevious();
        $isValidationException =
            $e instanceof HttpException && $e->getStatusCode() === 422;
        $isExceptionWithAction =
            $previous &&
            method_exists($previous, 'response') &&
            $previous->response() &&
            property_exists($previous->response(), 'action');

        if (
            config('app.debug') &&
            !config('app.demo') &&
            !$isValidationException &&
            false
        ) {
            $array = $this->ignitionReportFromThrowable($e);
        } else {
            $array = parent::convertExceptionToArray($e);
        }

        if ($isExceptionWithAction) {
            $array['action'] = $e->getPrevious()->response()->action;
        }

        if ($array['message'] === 'Server Error') {
            $array['message'] = __(
                'There was an issue. Please try again later.',
            );
        }

        if ($array['message'] === 'This action is unauthorized.') {
            $array['message'] = __(
                "You don't have required permissions for this action.",
            );
        }

        return $array;
    }

    protected function ignitionReportFromThrowable(Throwable $e): array
    {
        $report = app(Ignition::class)
            ->shouldDisplayException(false)
            ->handleException($e)
            ->toArray();

        $trace = array_map(function ($item) {
            $path = Str::of($item['class'] ?? $item['file'])
                ->replace([base_path(), 'vendor/laravel/framework/src/'], '')
                ->replace('\\', '/')
                ->trim('/')
                ->explode('/');
            return [
                'applicationFrame' => $item['application_frame'],
                'codeSnippet' => $item['code_snippet'],
                'path' => $path,
                'lineNumber' => $item['line_number'],
                'method' => $item['method'],
            ];
        }, $report['stacktrace']);

        $flatIndex = 0;
        $totalVendorGroups = 0;
        $groupedTrace = array_reduce(
            $trace,
            function ($carry, $item) use (&$flatIndex, &$totalVendorGroups) {
                $item['flatIndex'] = $flatIndex;
                if ($item['applicationFrame']) {
                    $carry[] = $item;
                } else {
                    if (Arr::get(Arr::last($carry), 'vendorGroup')) {
                        $carry[count($carry) - 1]['items'][] = $item;
                    } else {
                        $totalVendorGroups++;
                        $carry[] = [
                            'vendorGroup' => true,
                            'items' => [$item],
                        ];
                    }
                }
                $flatIndex++;
                return $carry;
            },
            [],
        );

        return [
            'ignitionTrace' => true,
            'message' => $report['message'],
            'exception' => $report['exception_class'],
            'file' => $report['stacktrace'][0]['file'],
            'line' => $report['stacktrace'][0]['line_number'],
            'trace' => $groupedTrace,
            'totalVendorGroups' => $totalVendorGroups,
            'phpVersion' => $report['language_version'],
            'appVersion' => config('app.version'),
        ];
    }

    protected function shouldReturnJson($request, Throwable $e)
    {
        if (str_starts_with($request->path(), 'api/')) {
            return true;
        }

        return parent::shouldReturnJson($request, $e);
    }
}
