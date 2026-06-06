<?php

namespace Common\Search\Controllers;

use Common\Core\BaseController;
use Illuminate\Database\Eloquent\Model;

class NormalizedModelsController extends BaseController
{
    public function show(string $modelType, int $modelId)
    {
        $namespace = modelTypeToNamespace($modelType);
        $with = request('with') ? explode(',', request('with')) : [];

        $model = app($namespace)->findOrFail($modelId);
        $model->load($with);

        $this->authorize('show', $model);

        return $this->success(['model' => $model->toNormalizedArray()]);
    }

    public function index(string $modelType)
    {
        $namespace = modelTypeToNamespace($modelType);
        $query = request('query');
        $with = request('with') ? explode(',', request('with')) : [];
        $modelIds = request('modelIds')
            ? explode(',', request('modelIds'))
            : [];

        $this->authorize('index', $namespace);

        $model = app($namespace);
        if ($query) {
            $model = $model->mysqlSearch($query);
        }

        $results = $model
            ->when($modelIds, fn($q) => $q->whereIn('id', $modelIds))
            ->take(15)
            ->get()
            ->load($with)
            ->map(fn(Model $model) => $model->toNormalizedArray());

        return $this->success(['results' => $results]);
    }
}
