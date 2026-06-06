<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasColumn('file_entries', 'user_id')) {
            $admin = User::findAdmin();

            DB::table('file_entries')
                ->where('owner_id', 0)
                ->lazyById(100)
                ->each(function ($fileEntry) use ($admin) {
                    $ownerId = $fileEntry->user_id ?: $admin?->id;

                    if (!$ownerId) {
                        return;
                    }

                    DB::table('file_entries')
                        ->where('id', $fileEntry->id)
                        ->update(['owner_id' => $ownerId]);
                });
        }
    }

    public function down()
    {
        //
    }
};
