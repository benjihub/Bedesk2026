<?php

namespace Common\Database;

use Common\Core\Manifest\BuildManifestFile;
use Common\Settings\GenerateFavicon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;

class MigrateAndSeed
{
    public function execute(callable $afterMigrateCallback = null): void
    {
        // Migrate
        if (!app('migrator')->repositoryExists()) {
            app('migration.repository')->createRepository();
        }
        $migrator = app('migrator');
        $paths = $migrator->paths();
        $paths[] = app('path.database') . DIRECTORY_SEPARATOR . 'migrations';
        $migrator->run($paths);

        $afterMigrateCallback && $afterMigrateCallback();

        $this->runCommonSeeders();

        // Seed
        $seeder = app(DatabaseSeeder::class);
        $seeder->setContainer(app());
        Model::unguarded(function () use ($seeder) {
            $seeder->__invoke();
        });

        // Manifest
        app(BuildManifestFile::class)->execute();

        $defaultFaviconPath = public_path('images/favicon-original.png');
        if (!env('INSTALLED') && file_exists($defaultFaviconPath)) {
            app(GenerateFavicon::class)->execute($defaultFaviconPath);
        }
    }

    public function runCommonSeeders(): void
    {
        $paths = [base_path() . '/common', base_path() . '/modules'];
        foreach ($paths as $directory) {
            if (!File::exists($directory)) {
                continue;
            }
            foreach (File::directories($directory) as $moduleDir) {
                $seedersDir = "$moduleDir/database/seeders";
                if (File::exists($seedersDir)) {
                    foreach (File::files($seedersDir) as $fileInfo) {
                        $content = file_get_contents($fileInfo->getPathname());

                        // Extract namespace from file content
                        if (
                            preg_match(
                                '/namespace\s+([^;\s]+)/m',
                                $content,
                                $matches,
                            )
                        ) {
                            $namespace =
                                trim($matches[1]) .
                                '\\' .
                                $fileInfo->getBasename('.php');

                            if (class_exists($namespace)) {
                                app($namespace)->run();
                            }
                        }
                    }
                }
            }
        }

        // legacy
        $paths = File::files(app('path.common') . '/database/seeders');
        foreach ($paths as $fileInfo) {
            Model::unguarded(function () use ($fileInfo) {
                try {
                    $namespace =
                        'Common\Database\Seeds\\' .
                        $fileInfo->getBaseName('.php');
                    $seeder = app($namespace)->setContainer(app());
                    $seeder->__invoke();
                } catch (\Exception $e) {
                    // ignore
                }
            });
        }
    }
}
