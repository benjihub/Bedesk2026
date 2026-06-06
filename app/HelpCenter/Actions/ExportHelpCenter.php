<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use App\HelpCenter\Models\HcCategory;
use Common\Files\Uploads\Uploads;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use ZipArchive;

class ExportHelpCenter
{
    protected ZipArchive $zip;

    public function execute()
    {
        $filename = storage_path('app/hc-export.zip');
        @unlink($filename);

        $this->zip = new ZipArchive();
        if ($this->zip->open($filename, ZipArchive::CREATE) !== true) {
            return null;
        }

        $data = HcCategory::rootOnly()
            ->with([
                'sections' => function ($builder) {
                    $builder->with([
                        'articles' => function ($builder) {
                            $builder->with('tags')->select('*');
                        },
                    ]);
                },
            ])
            ->get()
            ->each(function (HcCategory $category) {
                (new HcImagesExporter())->category($this->zip, $category);

                $category->sections->each(function (HcCategory $section) {
                    (new HcImagesExporter())->category($this->zip, $section);

                    $section->setRelation(
                        'articles',
                        $section->articles->unique('id'),
                    );

                    $section->articles->each(function (HcArticle $article) {
                        (new HcImagesExporter())->article($this->zip, $article);
                    });
                });
            });

        $this->zip->addFromString('help-center.json', json_encode($data));

        $this->zip->close();

        return $filename;
    }
}
