<?php

namespace Common\Core\Install;

use App\Models\User;
use Common\Auth\Permissions\Permission;
use Common\Database\MigrateAndSeed;
use Common\Settings\DotEnvEditor;
use Common\Settings\GenerateFavicon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class InstallController
{
    public function __construct()
    {
        if (config('app.installed')) {
            abort(404);
        }
    }

    public function introductionStep()
    {
        $this->createHtaccessFiles();
        return view('common::install/introduction');
    }

    public function requirementsStep()
    {
        $data = (new CheckSiteHealth())->execute();
        return view('common::install/requirements')->with($data);
    }

    public function databaseStep()
    {
        $credentials = config('database.connections.mysql');

        return view('common::install/database', [
            'host' => $credentials['host'],
            'database' => $credentials['database'],
            'username' => $credentials['username'],
            'password' => $credentials['password'],
            'port' => $credentials['port'],
            'prefix' => $credentials['prefix'],
        ]);
    }

    public function insertAndValidateDatabaseCredentials()
    {
        $data = request()->validate([
            'host' => 'required|string',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'port' => 'nullable|int',
            'prefix' => 'nullable|string|max:10',
        ]);

        $this->getEnvWriter()->write(
            collect($data)->mapWithKeys(
                fn($value, $key) => ['DB_' . strtoupper($key) => $value],
            ),
        );
        config()->set(
            'database.connections.mysql',
            array_merge(config('database.connections.mysql'), $data),
        );

        try {
            $tables = DB::select('SHOW TABLES');
            if (count($tables) > 0) {
                return back()->withErrors([
                    'database' =>
                        'Database is not empty. Please provide an empty database or delete all tables from the current one.',
                ]);
            }
        } catch (Exception $e) {
            return back()->withErrors([
                'database' => $e->getMessage(),
            ]);
        }

        if (!file_exists(base_path('.env'))) {
            rename(base_path('env.example'), base_path('.env'));
        }

        // need to change app key in the step before migration/seeding, otherwise it will use old key
        $appKey = 'base64:' . base64_encode(random_bytes(32));
        $this->getEnvWriter()->write(['APP_KEY' => $appKey]);
        config(['app.key' => $appKey]);
        Cache::flush();

        return redirect('install/admin');
    }

    public function adminStep()
    {
        return view('common::install/admin');
    }

    public function validateAdminCredentials()
    {
        $data = request()->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:4|confirmed',
        ]);

        return redirect('install/finalize')->with('adminCredentials', $data);
    }

    public function finalizeStep()
    {
        if (!session()->has('adminCredentials')) {
            return redirect('install/admin');
        }

        // clear cache
        Cache::flush();
        Schema::defaultStringLength(191);

        // run common migrations and seeders
        (new MigrateAndSeed())->execute(function () {
            (new InsertDefaultSettings())->execute();
            (new CreateDefaultMenus())->execute();
            (new CreateDefaultCustomPages())->execute();

            // create admin account and login
            $credentials = session('adminCredentials');
            $user = app(User::class)->firstOrNew([
                'email' => $credentials['email'],
            ]);
            $user->type = config('app.admin_user_type') ?? 'user';
            $user->password = $credentials['password'];
            $user->email_verified_at = now();
            $user->save();
            $adminPermission = app(Permission::class)->firstOrCreate(
                ['name' => 'admin'],
                [
                    'name' => 'admin',
                    'group' => 'admin',
                    'display_name' => 'Super Admin',
                    'description' => 'Give all permissions to user.',
                ],
            );
            $user->permissions()->syncWithoutDetaching($adminPermission->id);
            Auth::login($user);
        });

        $appUrl = $this->getFinalSiteUrl();

        // finalize
        $this->getEnvWriter()->write([
            'app_url' => $appUrl,
            'app_env' => 'production',
            'app_debug' => false,
            'cache_store' => 'file',
            'installed' => true,
        ]);
        config([
            'app.url' => $appUrl,
            'app.env' => 'production',
            'app.debug' => false,
            'cache.default' => 'file',
            'app.installed' => true,
        ]);

        // move default favicons
        File::copyDirectory(
            base_path('assets/favicons'),
            public_path(GenerateFavicon::FAVICON_DIR),
        );

        Cache::flush();

        return view('common::install/finalize')->with([
            'url' => $appUrl,
        ]);
    }

    protected function getFinalSiteUrl(): string
    {
        // config('app.url') will already be updated by "AppUrl" class at this point,
        // we just need to trim "public" in case .htaccess file was not created for some reason
        $url = config('app.url');
        $url = rtrim($url, 'public');
        return rtrim($url, '/');
    }

    protected function createHtaccessFiles(): void
    {
        $rootHtaccess = base_path('.htaccess');
        $rootHtaccessStub = base_path('htaccess.example');
        $publicHtaccess = public_path('.htaccess');
        $publicHtaccessStub = base_path('public/htaccess.example');

        if (!file_exists($rootHtaccess)) {
            $contents = file_get_contents($rootHtaccessStub);
            file_put_contents($rootHtaccess, $contents);
        }

        if (!file_exists($publicHtaccess)) {
            $contents = file_get_contents($publicHtaccessStub);
            file_put_contents($publicHtaccess, $contents);
        }
    }

    protected function getEnvWriter(): DotEnvEditor
    {
        return new DotEnvEditor(
            file_exists(base_path('.env')) ? '.env' : 'env.example',
        );
    }
}
