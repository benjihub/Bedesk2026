<?php

use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;

class LowercaseCustomSeoInSettingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $settings = Setting::where('name', 'like', 'seo.%')->get();

        $settings->each(function (Setting $setting) {
            $newValue = preg_replace_callback(
                '/({{[\w\.\-\?\:]+?}})/',
                function ($matches) {
                    return strtolower($matches[1]);
                },
                $setting->value,
            );
            $setting->value = $newValue;
            $setting->save();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
    }
}
