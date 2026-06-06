<?php

use Illuminate\Database\Migrations\Migration;

class MoveUploadsIntoSubfolders extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $drive = Storage::drive(config('filesystems.uploads_disk'));

        foreach ($drive->files() as $fileName) {
            $pathinfo = pathinfo($fileName);
            if (
                !isset($pathinfo['extension']) &&
                !\Str::contains($fileName, '.')
            ) {
                $drive->createDir("$fileName-temp");
                $drive->move($fileName, "$fileName-temp/$fileName");
                $drive->rename("$fileName-temp", $fileName);
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
