<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('attributables')) {
            return;
        }

        Schema::create('attributables', function (Blueprint $table) {
            $table->id();
            $table
                ->bigInteger('attributable_id')
                ->index()
                ->unsigned();
            $table
                ->bigInteger('attribute_id')
                ->index()
                ->unsigned();
            $table->string('attributable_type', 20)->index();
            $table
                ->string('value', 250)
                ->nullable()
                ->index();

            $table->unique(
                ['attributable_id', 'attributable_type', 'attribute_id'],
                'attributables_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attributables');
    }
};
