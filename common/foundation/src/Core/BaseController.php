<?php namespace Common\Core;

use App\Models\User;
use Common\Core\Demo\BlocksFunctionalityOnDemoSite;
use Common\Core\Prerender\HandlesSeo;
use Common\Core\Rendering\RendersClientSideApp;
use Illuminate\Auth\Access\Response as AuthResponse;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;

class BaseController extends Controller
{
    use AuthorizesRequests,
        DispatchesJobs,
        ValidatesRequests,
        HandlesSeo,
        RendersClientSideApp,
        BlocksFunctionalityOnDemoSite;

    // todo: refactor bedrive and belink policies to use basePolicy permission check and remove guest fetching here

    /**
     * Authorize a given action for the current user
     * or guest if user is not logged in.
     */
    public function authorize(
        string $ability,
        mixed $arguments = [],
    ): AuthResponse {
        if (Auth::check()) {
            [$ability, $arguments] = $this->parseAbilityAndArguments(
                $ability,
                $arguments,
            );
            return app(Gate::class)->authorize($ability, $arguments);
        } else {
            $guest = new User();
            // make sure ID is not NULL to avoid false positives in authorization
            $guest->forceFill(['id' => -1]);
            $guest->setRelation('roles', collect([app('guestRole')]));
            return $this->authorizeForUser($guest, $ability, $arguments);
        }
    }

    public function renderClientOrApi(array $options)
    {
        $data = Arr::get($options, 'data', []);
        $pageName = Arr::get($options, 'pageName');
        if ($pageName) {
            $seoTagsView = View::exists("editable-views::seo-tags.$pageName")
                ? "editable-views::seo-tags.$pageName"
                : "seo.$pageName.seo-tags";
        }

        // if it's an API request, simply return data as JSON
        if (isApiRequest()) {
            // only include SEO tags for internal API requests
            if (requestIsFromFrontend() && isset($seoTagsView)) {
                $data['seo'] = view($seoTagsView, $options['data'])->render();
            }
            return response()->json($data);
        }

        // if it's a web request, prerender a simple blade page for crawlers
        if (
            !Arr::get($options, 'noPrerender') &&
            isCrawler() &&
            $pageName &&
            View::exists("seo.$pageName.prerender")
        ) {
            return view("seo.$pageName.prerender", $data)->with([
                'htmlBaseUri' => app(AppUrl::class)->htmlBaseUri,
                'seoTagsView' => $seoTagsView ?? null,
            ]);
        }

        // finally render the full react app
        return $this->renderClientSideApp([
            'pageData' => $data,
            'seoTagsView' => $seoTagsView ?? null,
        ]);
    }

    public function success(
        array|Collection $data = [],
        int $status = 200,
        array $options = [],
    ) {
        $data = $data ?: [];
        if (!Arr::get($data, 'status')) {
            $data['status'] = 'success';
        }

        // only generate seo tags if request is coming from frontend and not from API
        if (
            (requestIsFromFrontend() || defined('SHOULD_PRERENDER')) &&
            ($response = $this->handleSeo($data, $options))
        ) {
            return $response;
        }

        foreach ($data as $key => $value) {
            if ($value instanceof Arrayable) {
                $data[$key] = $value->toArray();
            }
        }

        return response()->json($data, $status);
    }

    /**
     * Return error response with specified messages.
     */
    public function error(
        ?string $message = '',
        array $errors = [],
        int $status = 422,
        $data = [],
    ) {
        $data = array_merge($data, [
            'message' => $message,
            'errors' => $errors ?: [],
        ]);
        return response()->json($data, $status);
    }

    public function stream(callable $callback)
    {
        return response()->stream($callback, 200, [
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
            'Content-Type' => 'text/event-stream',
            'Content-Encoding' => 'disabled',
        ]);
    }
}
