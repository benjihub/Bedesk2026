<?php namespace App\HelpCenter\Controllers;

use App\HelpCenter\Actions\ExportHelpCenter;
use App\HelpCenter\Actions\ImportHelpCenter;
use Common\Core\BaseController;

class HcActionsController extends BaseController
{
    public function __construct()
    {
        $this->middleware('isAdmin');
    }

    public function export()
    {
        $filename = (new ExportHelpCenter())->execute();

        return response(file_get_contents($filename), 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="hc-export.zip',
        ]);
    }

    public function import()
    {
        $data = $this->validate(request(), [
            'file' => 'required|file|mimetypes:application/zip',
        ]);

        $this->blockOnDemoSite();

        $path = storage_path('app/hc-import.zip');

        file_put_contents(
            $path,
            file_get_contents($data['file']->getRealPath()),
        );

        (new ImportHelpCenter())->execute($path);
        return $this->success();
    }
}
