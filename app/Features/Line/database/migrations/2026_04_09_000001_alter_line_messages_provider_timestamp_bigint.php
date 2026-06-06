<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasTable('line_messages')) {
            return;
        }

        // Use raw statement to avoid requiring doctrine/dbal for column change
        DB::statement('ALTER TABLE `line_messages` MODIFY `provider_timestamp` BIGINT NULL');
    }

    public function down()
    {
        if (!Schema::hasTable('line_messages')) {
            return;
        }

        DB::statement('ALTER TABLE `line_messages` MODIFY `provider_timestamp` INT NULL');
    }
};
