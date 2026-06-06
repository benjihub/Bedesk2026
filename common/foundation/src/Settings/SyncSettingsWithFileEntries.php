<?php

namespace Common\Settings;

use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\FileEntry;
use Common\Settings\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SyncSettingsWithFileEntries
{
    protected SyncFileEntryModels $syncer;

    public function __construct()
    {
        $this->syncer = new SyncFileEntryModels();
    }

    public function execute()
    {
        $fileNames = [];
        $fileNamesByKey = [];

        foreach (Setting::all()->pluck('value', 'name') as $key => $value) {
            $settingFileNames = [];
            if (in_array($key, Settings::$jsonKeys) && is_array($value)) {
                $this->syncer->extractFileNamesFromArray(
                    $value,
                    $settingFileNames,
                );
            } else {
                if (
                    $filename = $this->syncer->entryFileNameFromString($value)
                ) {
                    $settingFileNames[] = $filename;
                }
            }

            if (!empty($settingFileNames)) {
                $fileNamesByKey[$key] = $settingFileNames;
                $fileNames = array_merge($fileNames, $settingFileNames);
            }
        }

        if (!empty($fileNames)) {
            $this->insertRecords($fileNames, $fileNamesByKey);
        }
    }

    protected function insertRecords(array $fileNames, array $fileNamesByKey)
    {
        $entries = FileEntry::whereIn('file_name', $fileNames)
            ->pluck('id', 'file_name')
            ->toArray();

        $settings = Setting::whereIn(
            'name',
            array_keys($fileNamesByKey),
        )->pluck('id', 'name');

        // get current records from file_entry_models table
        $current = DB::table('file_entry_models')
            ->where('model_type', Setting::MODEL_TYPE)
            ->where('relation_type', 'settings')
            ->get();

        // build records for all current settings that have file entries attached
        $records = [];
        foreach ($fileNamesByKey as $key => $fileNames) {
            foreach ($fileNames as $fileName) {
                $entry = $entries[$fileName] ?? null;
                $setting = $settings[$key] ?? null;
                if ($entry && $setting) {
                    $records[] = [
                        'model_type' => Setting::MODEL_TYPE,
                        'model_id' => $setting,
                        'file_entry_id' => $entry,
                        'relation_type' => 'settings',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // detach previously attached entries that are no longer attached
        $recordsEntryIds = array_column($records, 'file_entry_id');
        $toDetach = $current
            ->filter(fn($r) => !in_array($r->file_entry_id, $recordsEntryIds))
            ->pluck('id');
        if (!$toDetach->isEmpty()) {
            DB::table('file_entry_models')->whereIn('id', $toDetach)->delete();
        }

        // insert new records that are not attached yet
        $toAttach = array_filter(
            $records,
            fn($r) => !$current->some(
                fn($c) => $c->file_entry_id === $r['file_entry_id'] &&
                    $c->model_id === $r['model_id'],
            ),
        );
        if (!empty($toAttach)) {
            DB::table('file_entry_models')->insert($toAttach);
        }
    }
}
