<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Common\Auth\Permissions\Permission;
use Common\Auth\Roles\Role;

$permissionId = Permission::where('name', 'ai_agent.update')->value('id');
$roles = Role::whereIn('name', ['Agents', 'Admins'])->pluck('id', 'name');

$result = DB::table('permissionables')
    ->where('permission_id', $permissionId)
    ->whereIn('permissionable_id', $roles)
    ->where('permissionable_type', Role::MODEL_TYPE)
    ->get();

var_dump($result);
