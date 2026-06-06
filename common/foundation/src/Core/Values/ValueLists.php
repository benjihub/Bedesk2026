<?php namespace Common\Core\Values;

use Common\Settings\Themes\CssTheme;
use Common\Auth\Permissions\Permission;
use Common\Auth\Roles\Role;
use Common\Domains\CustomDomain;
use Common\Files\FileEntry;
use Common\Localizations\Localization;
use Common\Pages\CustomPage;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use const App\Providers\WORKSPACED_RESOURCES;

class ValueLists
{
    public function __construct(
        protected Filesystem $fs,
        protected Localization $localization,
    ) {}

    public function get(string $names, array $params = []): Collection|array
    {
        return collect(explode(',', $names))
            ->mapWithKeys(function ($name) use ($params) {
                $methodName = Str::studly($name);
                $value = method_exists($this, $methodName)
                    ? $this->$methodName($params)
                    : $this->loadAppValueFile($name, $params);
                return [$name => $value];
            })
            ->filter();
    }

    public function roles(): Collection
    {
        return app(Role::class)->where('type', 'users')->get();
    }

    public function workspaceRoles(): Collection
    {
        return app(Role::class)->where('type', 'workspace')->get();
    }

    public function currencies()
    {
        return json_decode(
            File::get(app('path.common') . '/resources/lists/currencies.json'),
            true,
        );
    }

    public function timezones()
    {
        return json_decode(
            File::get(app('path.common') . '/resources/lists/timezones.json'),
            true,
        );
    }

    public function countries()
    {
        return json_decode(
            File::get(app('path.common') . '/resources/lists/countries.json'),
            true,
        );
    }

    public function languages()
    {
        return json_decode(
            File::get(app('path.common') . '/resources/lists/languages.json'),
            true,
        );
    }

    public function localizations()
    {
        return $this->localization->get(['id', 'name', 'language']);
    }

    public function googleFonts(): array
    {
        $googleFonts = json_decode(
            File::get(
                app('path.common') . '/resources/lists/google-fonts.json',
            ),
            true,
        );
        return array_map(function ($font) {
            return [
                'family' => $font['family'],
                'category' => $font['category'],
                'google' => true,
            ];
        }, $googleFonts);
    }

    public function menuItemCategories(): array
    {
        return array_map(function ($category) {
            $category['items'] = app($category['itemsLoader'])->execute();
            unset($category['itemsLoader']);
            return $category;
        }, config('menus'));
    }

    public function pages($params = [])
    {
        if (!isset($params['userId'])) {
            app(Gate::class)->authorize('index', CustomPage::class);
        }

        $query = app(CustomPage::class)
            ->select(['id', 'title'])
            ->where(
                'type',
                Arr::get($params, 'pageType') ?: CustomPage::PAGE_TYPE,
            );

        if ($userId = Arr::get($params, 'userId')) {
            $query->where('user_id', $userId);
        }

        return $query->get();
    }

    public function domains(Collection|array $params): Collection
    {
        return app(CustomDomain::class)
            ->select(['host', 'id'])
            ->where('user_id', Arr::get($params, 'userId'))
            ->orWhere('global', true)
            ->get();
    }

    public function themes(Collection|array $params): Collection
    {
        app(Gate::class)->authorize('index', CssTheme::class);
        return app(CssTheme::class)
            ->select(['name', 'id'])
            ->get();
    }

    private function loadAppValueFile(string $name, array $params): ?array
    {
        $fileName = Str::kebab($name);
        $path = resource_path("lists/$fileName.json");
        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true);
        }
        return null;
    }
}
