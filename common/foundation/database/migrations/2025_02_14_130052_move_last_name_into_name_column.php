<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'last_name')) {
            DB::table('users')
                ->whereNotNull('last_name')
                ->chunkById(100, function (Collection $users) {
                    foreach ($users as $user) {
                        $name = collect([
                            $user->first_name ?? $user->name,
                            $user->last_name,
                        ])
                            ->filter()
                            ->join(' ');
                        if ($name) {
                            try {
                                DB::table('users')
                                    ->where('id', $user->id)
                                    ->update([
                                        'name' => Str::limit($name, 90),
                                        'last_name' => null,
                                    ]);
                            } catch (\Exception $e) {
                                //
                            }
                        }
                    }
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
