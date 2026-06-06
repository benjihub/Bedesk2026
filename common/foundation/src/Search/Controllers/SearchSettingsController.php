<?php

namespace Common\Search\Controllers;

use Common\Core\BaseController;
use Common\Search\ImportRecordsIntoScout;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class SearchSettingsController extends BaseController
{
    public function getSearchableModels()
    {
        $models = ImportRecordsIntoScout::getSearchableModels();

        $models = array_map(function (string $model) {
            return [
                'model' => $model,
                'name' => Str::plural(last(explode('\\', $model))),
            ];
        }, $models);

        return $this->success(['models' => $models]);
    }

    public function import()
    {
        $this->middleware('isAdmin');
        $this->blockOnDemoSite();

        (new ImportRecordsIntoScout())->execute(
            request('model'),
            request('driver'),
        );

        return $this->success(['output' => nl2br(Artisan::output())]);
    }
}
