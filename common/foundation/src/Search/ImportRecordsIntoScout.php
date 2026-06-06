<?php

namespace Common\Search;

use Algolia\AlgoliaSearch\Config\SearchConfig;
use Algolia\AlgoliaSearch\SearchClient as Algolia;
use App\Attributes\Models\CustomAttribute;
use App\Models\User;
use Common\Core\BaseModel;
use Common\Search\Drivers\Mysql\MysqlFullTextIndexer;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Laravel\Scout\Console\ImportCommand;
use Laravel\Scout\EngineManager;
use Meilisearch\Client as MeilisearchClient;

class ImportRecordsIntoScout
{
    public function execute(
        string $modelToImport = '*',
        string|null $driver = null,
    ): void {
        @set_time_limit(0);
        @ini_set('memory_limit', '200M');

        if ($driver) {
            config()->set('scout.driver', $driver);
        }
        $driver = config('scout.driver');

        $models =
            $modelToImport === '*'
                ? self::getSearchableModels()
                : [$modelToImport];

        if ($driver === 'mysql') {
            foreach ($models as $model) {
                app(MysqlFullTextIndexer::class)->createOrUpdateIndex($model);
            }
        } elseif ($driver === 'meilisearch') {
            $this->configureMeilisearchIndices($models);
        } elseif ($driver === 'algolia') {
            $this->configureAlgoliaIndices($models);
        }

        $this->importUsingDefaultScoutCommand($models);
    }

    public static function getSearchableModels(): array
    {
        return collect(config('scout.meilisearch.index-settings'))
            ->keys()
            ->toArray();
    }

    private function importUsingDefaultScoutCommand(array $models): void
    {
        Artisan::registerCommand(app(ImportCommand::class));
        foreach ($models as $model) {
            $model = addslashes($model);
            Artisan::call("scout:import \"$model\"");
        }
    }

    private function configureAlgoliaIndices(array $models): void
    {
        $config = SearchConfig::create(
            config('scout.algolia.id'),
            config('scout.algolia.secret'),
        );

        $algolia = Algolia::createWithConfig($config);
        foreach ($models as $model) {
            $filterableFields = $this->getFilterableFields($model);

            // keep ID searchable as there are issues with scout otherwise
            if (($key = array_search('id', $filterableFields)) !== false) {
                unset($filterableFields[$key]);
            }

            $model = new $model();
            $indexName = $model->searchableAs();
            $algolia->initIndex($indexName)->setSettings([
                'attributesForFaceting' => array_values(
                    array_map(
                        fn($field) => "filterOnly($field)",
                        $filterableFields,
                    ),
                ),
            ]);
        }
    }

    private function configureMeilisearchIndices(array $models): void
    {
        $engine = app(EngineManager::class)->engine('meilisearch');

        foreach ($models as $modelName) {
            $model = new $modelName();
            $indexName = $model->searchableAs();
            $modelConfig =
                config("scout.meilisearch.index-settings.$modelName") ?? [];

            $searchableFields = array_merge(
                ['id'],
                $model->getSearchableKeys(),
            );
            $displayedFields = $searchableFields;
            $filterableFields = $this->getFilterableFields($model);

            try {
                $engine->deleteIndex($indexName);
            } catch (Exception $e) {
                //
            }

            $modelConfig['searchableAttributes'] = array_merge(
                $modelConfig['searchableAttributes'] ?? [],
                $searchableFields,
            );
            $modelConfig['filterableAttributes'] = array_merge(
                $modelConfig['filterableAttributes'] ?? [],
                $filterableFields,
            );
            $modelConfig['displayedAttributes'] = array_merge(
                $modelConfig['displayedAttributes'] ?? [],
                $displayedFields,
            );

            if (in_array(SupportsVectorSearch::class, class_uses($model))) {
                $modelConfig['embedders'] = [
                    $model::MODEL_TYPE => [
                        'source' => 'userProvided',
                        'dimensions' => $model->getVectorDimensions(),
                    ],
                ];
            }

            if (!empty($modelConfig)) {
                $engine->updateIndexSettings($indexName, $modelConfig);
            }
        }
    }

    private function getFilterableFields(BaseModel $model): array
    {
        $filterableFields = $model::filterableFields();
        if (
            in_array('ca_*', $filterableFields) &&
            class_exists(CustomAttribute::class)
        ) {
            $attributes = CustomAttribute::where(
                'type',
                $model->getMorphClass(),
            )
                ->pluck('key')
                ->map(fn($key) => "ca_$key");
            $filterableFields = array_merge(
                $filterableFields,
                $attributes->toArray(),
            );

            $filterableFields = array_filter(
                $filterableFields,
                fn($field) => $field !== 'ca_*',
            );
        }

        return array_values($filterableFields);
    }
}
