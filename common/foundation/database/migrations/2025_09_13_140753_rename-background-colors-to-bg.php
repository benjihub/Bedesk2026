<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $themes = DB::table('css_themes')->get();

        foreach ($themes as $theme) {
            $newValues = str_replace(
                [
                    '--be-background',
                    '--be-background-alt',
                    '--be-background-chip',
                    '--be-background-elevated',
                    '--be-foreground-base',
                ],
                [
                    '--be-bg',
                    '--be-bg-alt',
                    '--be-bg-chip',
                    '--be-bg-elevated',
                    '--be-fg-base',
                ],
                $theme->values,
            );

            // add elevated color
            $newValues = json_decode($newValues, true);
            $newValues['--be-bg-elevated'] = $theme->is_dark
                ? config('themes.dark.--be-bg-elevated')
                : config('themes.light.--be-bg-elevated');
            DB::table('css_themes')
                ->where('id', $theme->id)
                ->update([
                    'values' => json_encode($newValues),
                ]);
        }
    }
};
