<?php

namespace App\Demo;

use App\Attributes\Models\CustomAttribute;
use App\Core\Modules;
use Common\Core\Install\CreateDefaultCustomPages;
use Common\Core\Install\CreateDefaultMenus;
use Common\Core\Install\InsertDefaultSettings;
use Common\Database\MigrateAndSeed;
use Common\Search\ImportRecordsIntoScout;
use Common\Settings\DotEnvEditor;
use Common\Settings\Models\Setting;
use Common\Settings\Settings;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class ResetDemoSite
{
    public function execute()
    {
        Artisan::call('optimize:clear');
        Artisan::call('down');

        $originalScoutDriver = config('scout.driver');
        config()->set('scout.driver', 'null');

        $originalCacheDriver = config('cache.default');
        config()->set('cache.default', 'null');

        $this->recreateDatabase();

        app(Settings::class)->loadSettings();

        (new CreateDemoGroups())->execute();
        (new CreateDemoAgents())->execute();
        (new CreateDemoCannedReplies())->execute();
        (new CreateDemoCustomers())->execute();
        (new CreateDemoHelpCenter())->execute();
        (new CreateDemoPageVisits())->execute();
        (new CreateDemoFields())->execute();
        (new CreateDemoViews())->execute();
        (new CreateDemoConversations())->execute();
        (new CreateDemoAttachments())->execute();
        (new CreateDemoMessages())->execute();
        (new CreateDemoTags())->execute();
        (new CreateDemoSearchTerms())->execute();
        if (Modules::livechatInstalled()) {
            (new CreateDemoCampaigns())->execute();
        }

        if (Modules::aiInstalled()) {
            (new CreateDemoToolsAndFlows())->execute();
        }

        $this->updateSettings();

        config()->set('cache.default', $originalCacheDriver);
        config()->set('scout.driver', $originalScoutDriver);

        (new ImportRecordsIntoScout())->execute('*');

        Artisan::call('up');
        if (config('app.env') === 'production') {
            Artisan::call('optimize');
            // demo site is missing logo and some other settings without this
            Artisan::call('cache:clear');
        }
    }

    protected function recreateDatabase()
    {
        Schema::dropAllTables();

        $this->bootstrapFreshInstall();

        // need to re-add menu items from modules
        if (Modules::aiInstalled()) {
            DB::table('migrations')
                ->where('migration', 'like', '%add_ai_agent_menu_items')
                ->delete();
        }
        if (Modules::livechatInstalled()) {
            DB::table('migrations')
                ->where('migration', 'like', '%add_livechat_menu_items')
                ->delete();
        }

        Artisan::call('migrate', ['--force' => true]);
    }

    protected function bootstrapFreshInstall(): void
    {
        @ini_set('memory_limit', '-1');
        @set_time_limit(0);

        Schema::defaultStringLength(191);

        app(MigrateAndSeed::class)->execute(function () {
            (new InsertDefaultSettings())->execute();
            (new CreateDefaultMenus())->execute();
            (new CreateDefaultCustomPages())->execute();
        });

        $this->syncEnvFile();

        Cache::flush();

        $path = config('view.compiled');
        foreach (File::glob("{$path}/*") as $view) {
            File::delete($view);
        }
    }

    protected function syncEnvFile(): void
    {
        if (!file_exists(base_path('env.example')) || !file_exists(base_path('.env'))) {
            return;
        }

        $envExampleValues = (new DotEnvEditor('env.example'))->load('env.example');
        $editor = new DotEnvEditor();
        $currentEnvValues = $editor->load();

        $envValuesToWrite = array_diff_key($envExampleValues, $currentEnvValues);
        $envValuesToWrite['app_version'] = $envExampleValues['app_version'];
        $envValuesToWrite['installed'] = true;

        if (!isset($currentEnvValues['mail_setup'])) {
            $envValuesToWrite['mail_setup'] = true;
        }

        if (($currentEnvValues['scout_driver'] ?? null) === 'mysql-like') {
            $envValuesToWrite['scout_driver'] = 'mysql';
        }

        if (!empty($envValuesToWrite)) {
            $editor->write($envValuesToWrite);
        }
    }

    protected function updateSettings()
    {
        $attributes = CustomAttribute::query()->pluck('id', 'key');
        $hcNewTicket = Setting::where(
            'name',
            'hc.newTicket.appearance',
        )->first();
        $value = $hcNewTicket->value;
        $value['attributeIds'] = [
            $attributes['category'],
            $attributes['subject'],
            $attributes['description'],
        ];
        $hcNewTicket->value = $value;
        $hcNewTicket->save();

        Setting::where('name', 'i18n.enable')->update(['value' => false]);
        Setting::where('name', 'social.google.enable')->update([
            'value' => true,
        ]);
        Setting::where('name', 'cookie_notice.enable')->update([
            'value' => false,
        ]);
        Setting::where('name', 'uploading.chunk_size')->update([
            'value' => 4_194_304,
        ]); //4MB
    }
}
