<?php namespace Livechat\Database\Seeders;

use App\Models\User;
use Common\Settings\Themes\CssTheme;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Seeder;

class LivechatCssThemesTableSeeder extends Seeder
{
    public function run(): void
    {
        $dark = config('themes.dark');
        $light = config('themes.light');

        $admin = User::whereHas('permissions', function (Builder $builder) {
            $builder->where('name', 'admin');
        })->first();

        $darkTheme = CssTheme::where('type', 'chatWidget')
            ->where('default_dark', true)
            ->first();
        if (!$darkTheme || !$darkTheme->getRawOriginal('values')) {
            if ($darkTheme) {
                $darkTheme->delete();
            }
            CssTheme::create([
                'name' => 'Dark',
                'is_dark' => true,
                'type' => 'chatWidget',
                'default_dark' => true,
                'values' => $dark,
                'user_id' => $admin ? $admin->id : 1,
            ]);
        }

        $lightTheme = CssTheme::where('type', 'chatWidget')
            ->where('default_light', true)
            ->first();
        if (!$lightTheme || !$lightTheme->getRawOriginal('values')) {
            if ($lightTheme) {
                $lightTheme->delete();
            }
            CssTheme::create([
                'name' => 'Light',
                'default_light' => true,
                'type' => 'chatWidget',
                'user_id' => $admin ? $admin->id : 1,
                'values' => $light,
            ]);
        }
    }
}
