<?php

namespace Common\Core\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateSimplePaginateTables extends Command
{
    protected $signature = 'pagination:optimize';
    protected $description = 'Optimize pagination for large tables.';

    public function handle(): int
    {
        $max = 150000;

        $tables = [];

        collect(DB::select('SHOW TABLES'))
            ->map(function ($val) {
                foreach ($val as $key => $tbl) {
                    return $tbl;
                }
            })
            ->each(function ($table) use ($max, &$tables) {
                $prefix = config('database.connections.mysql.prefix');
                $table = preg_replace("/^{$prefix}/", '', $table);
                if (DB::table($table)->count() > $max) {
                    $tables[] = $table;
                }
            });

        settings()->save([
            'simple_pagination_tables' => implode(',', $tables),
        ]);

        $this->info(
            sprintf(
                'Tables with more than %d rows: %s',
                $max,
                implode(', ', $tables),
            ),
        );

        return Command::SUCCESS;
    }
}
