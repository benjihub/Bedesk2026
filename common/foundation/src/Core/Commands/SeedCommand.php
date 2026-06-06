<?php namespace Common\Core\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class SeedCommand extends Command
{
    protected $signature = 'common:seed';

    protected $description = 'Execute all common package seeders.';

    public function handle()
    {
        $paths = collect(File::files(app('path.common') . '/database/seeders'));

        $paths->filter(function($path) {
            return Str::endsWith($path, '.php');
        })->each(function($path) {
            Model::unguarded(function () use ($path) {
                $namespace = 'Common\Database\Seeds\\'.basename($path, '.php');
                $this->getSeeder($namespace)->__invoke();
            });
        });

        $this->info('Seeded database successfully.');
    }

    protected function getSeeder(string $namespace): Seeder
    {
        $class = $this->laravel->make($namespace);

        return $class->setContainer($this->laravel)->setCommand($this);
    }
}
