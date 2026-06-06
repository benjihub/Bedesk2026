<?php

namespace Common\Csv;

use Illuminate\Support\Facades\Auth;
use Common\Auth\Jobs\ExportRolesCsv;
use Common\Auth\Jobs\ExportUsersCsv;
use Common\Csv\BaseCsvExportController;

class CommonCsvExportController extends BaseCsvExportController
{
    public function exportUsers()
    {
        return $this->exportUsing(new ExportUsersCsv(Auth::id()));
    }

    public function exportRoles()
    {
        return $this->exportUsing(new ExportRolesCsv(Auth::id()));
    }
}
