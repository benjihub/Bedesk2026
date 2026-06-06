<?php

use Common\Auth\Roles\Role;
use Common\Settings\Themes\CssTheme;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('group_user', 'chat_priority')) {
            Schema::table('group_user', function (Blueprint $table) {
                $table->renameColumn('chat_priority', 'conversation_priority');
            });
        }

        // delete status tags
        DB::table('tags')->where('type', 'status')->delete();

        // change type of old agents role
        Role::where('name', 'agents')->update(['type' => 'agents']);

        // delete all menus so new ones are created from default config
        DB::table('settings')->where('name', 'menus')->delete();

        // increate radius on css themes
        $values = config('themes.light');
        $variableNames = [
            '--be-button-radius',
            '--be-input-radius',
            '--be-panel-radius',
        ];
        CssTheme::all()->each(function ($theme) use ($variableNames, $values) {
            $oldValue = $theme->values;
            foreach ($variableNames as $variable) {
                $oldValue[$variable] = $values[$variable];
            }
            $theme->values = $oldValue;
            $theme->save();
        });
    }
};
