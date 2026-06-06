<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasColumn('conversations', 'request_ip')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->string('request_ip', 45)->nullable()->after('channel');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('conversations', 'request_ip')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropColumn('request_ip');
            });
        }
    }
};
