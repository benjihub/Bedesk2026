<?php

namespace Common\Search\Commands;

use Common\Search\ImportRecordsIntoScout;
use Illuminate\Console\Command;

class ImportRecordsIntoScoutCommand extends Command
{
    protected $signature = 'search:import-records-into-scout {model?} {driver?}';

    protected $description = 'Import records into scout';

    public function handle(): void
    {
        (new ImportRecordsIntoScout())->execute(
            $this->argument('model') ?? '*',
            $this->argument('driver') ?? config('scout.driver'),
        );
    }
}
