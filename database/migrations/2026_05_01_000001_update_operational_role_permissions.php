<?php

use Common\Auth\Permissions\Permission;
use Common\Auth\Roles\Role;
use Common\Settings\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private array $adminPermissions = [
        'admin.access',
        'articles.view',
        'conversations.update',
        'agents.update',
        'groups.view',
        'groups.create',
        'groups.update',
        'groups.delete',
        'ai_agent.settings.update',
        'livechat.update',
        'files.create',
    ];

    private array $agentPermissions = [
        'articles.view',
        'conversations.update',
        'files.create',
    ];

    private array $restrictedAdminPermissions = [
        'settings.update',
        'ai_agent.update',
        'appearance.update',
        'api.access',
        'articles.update',
        'canned_replies.update',
        'custom_pages.update',
        'files.update',
        'localizations.update',
        'reports.view',
        'roles.update',
        'statuses.update',
        'tags.update',
        'triggers.update',
        'users.update',
        'views.update',
    ];

    private array $restrictedAgentPermissions = [
        'ai_agent.update',
        'ai_agent.settings.update',
        'articles.update',
        'canned_replies.update',
        'groups.create',
        'groups.delete',
        'groups.update',
        'groups.view',
        'reports.view',
        'settings.update',
        'tags.update',
        'users.update',
    ];

    public function up(): void
    {
        $this->ensurePermissions([
            ...$this->adminPermissions,
            'ai_agent.update',
            'settings.update',
        ]);

        $this->syncRole('Admins', $this->adminPermissions, $this->restrictedAdminPermissions);
        $this->syncRole('Agents', $this->agentPermissions, $this->restrictedAgentPermissions);
        $this->updateMenusForOperationalAdmins();
    }

    public function down(): void
    {
        $this->grantRolePermissions('Admins', [
            ...$this->restrictedAdminPermissions,
            'ai_agent.update',
        ]);
        $this->grantRolePermissions('Agents', ['ai_agent.update']);
        $this->revokeRolePermissions('Admins', [
            'ai_agent.settings.update',
            'livechat.update',
        ]);
        $this->revokeRolePermissions('Agents', ['ai_agent.settings.update']);
    }

    private function syncRole(
        string $roleName,
        array $grantPermissions,
        array $revokePermissions,
    ): void {
        $this->revokeRolePermissions($roleName, $revokePermissions);
        $this->grantRolePermissions($roleName, $grantPermissions);
    }

    private function ensurePermissions(array $permissions): void
    {
        foreach (array_unique($permissions) as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'type' => 'users',
            ]);
        }
    }

    private function grantRolePermissions(string $roleName, array $permissions): void
    {
        $role = Role::where('name', $roleName)->first();
        if (!$role) {
            return;
        }

        foreach (array_unique($permissions) as $permissionName) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionName,
                'type' => 'users',
            ]);

            DB::table('permissionables')->updateOrInsert([
                'permission_id' => $permission->id,
                'permissionable_id' => $role->id,
                'permissionable_type' => Role::MODEL_TYPE,
            ]);
        }
    }

    private function revokeRolePermissions(string $roleName, array $permissions): void
    {
        $role = Role::where('name', $roleName)->first();
        if (!$role) {
            return;
        }

        $permissionIds = Permission::whereIn('name', $permissions)
            ->where('type', 'users')
            ->pluck('id');

        if ($permissionIds->isEmpty()) {
            return;
        }

        DB::table('permissionables')
            ->whereIn('permission_id', $permissionIds)
            ->where('permissionable_id', $role->id)
            ->where('permissionable_type', Role::MODEL_TYPE)
            ->delete();
    }

    private function updateMenusForOperationalAdmins(): void
    {
        $setting = Setting::where('name', 'menus')->first();
        if (!$setting || !is_array($setting->value)) {
            return;
        }

        $menus = $setting->value;
        $didUpdate = false;

        foreach ($menus as &$menu) {
            $isDashboardSidebar = in_array(
                'dashboard-sidebar',
                $menu['positions'] ?? [],
            );

            foreach ($menu['items'] ?? [] as &$item) {
                if (($item['action'] ?? null) === '/admin/settings/livechat') {
                    $item['action'] = '/dashboard/livechat';
                    $item['permissions'] = ['livechat.update'];
                    $didUpdate = true;
                }

                if (($item['action'] ?? null) === '/dashboard/ai-agent') {
                    $item['permissions'] = ['ai_agent.settings.update'];
                    $didUpdate = true;
                }

                if (($item['action'] ?? null) === '/admin/ai-agent') {
                    $item['permissions'] = ['ai_agent.update'];
                    $didUpdate = true;
                }

                if (($item['action'] ?? null) === '/admin/settings') {
                    $item['permissions'] = ['settings.update'];
                    $didUpdate = true;
                }
            }

            if ($isDashboardSidebar) {
                $items = $menu['items'] ?? [];
                $hasLivechat = collect($items)->contains(
                    fn($item) =>
                        ($item['action'] ?? null) === '/dashboard/livechat',
                );

                if (!$hasLivechat) {
                    $conversationIndex = collect($items)->search(
                        fn($item) =>
                            ($item['action'] ?? null) ===
                            '/dashboard/conversations?viewId=mine',
                    );
                    $livechatItem = [
                        'label' => 'Livechat',
                        'id' => 'lcadmin1',
                        'action' => '/dashboard/livechat',
                        'type' => 'route',
                        'permissions' => ['livechat.update'],
                    ];

                    if ($conversationIndex === false) {
                        $items[] = $livechatItem;
                    } else {
                        array_splice($items, $conversationIndex + 1, 0, [
                            $livechatItem,
                        ]);
                    }

                    $menu['items'] = $items;
                    $didUpdate = true;
                }
            }
        }

        if ($didUpdate) {
            $setting->value = $menus;
            $setting->save();
            Cache::forget('settings.public');
        }
    }
};
