<?php

namespace Common\Database\Traits;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;

trait AddsIndexToExistingTable
{
    protected function addIndexIfDoesNotExist(
        Blueprint $table,
        string|array $columns,
        string $type = 'index',
    ) {
        $tableName = $table->getTable();
        $indexesFound = Schema::getIndexListing($tableName);
        $columNames = join('_', Arr::wrap($columns));
        $suffix = $type === 'index' ? 'index' : 'unique';
        if (!in_array("{$tableName}_{$columNames}_{$suffix}", $indexesFound)) {
            $type === 'index'
                ? $table->index($columns)
                : $table->unique($columns);
        }
    }

    protected function removeIndex(Blueprint $table, string $indexName)
    {
        if (str_ends_with($indexName, '_unique')) {
            $this->removeUniqueIndex($table, $indexName);
        } else {
            $tableName = $table->getTable();
            $indexesFound = Schema::getIndexListing($tableName);
            if (in_array($indexName, $indexesFound)) {
                $table->dropIndex($indexName);
            }
        }
    }

    protected function removeUniqueIndex(Blueprint $table, string $indexName)
    {
        $tableName = $table->getTable();
        $indexesFound = Schema::getIndexListing($tableName);
        if (in_array($indexName, $indexesFound)) {
            $table->dropUnique($indexName);
        }
    }
}
