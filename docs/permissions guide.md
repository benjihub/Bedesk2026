# UI Guide: Role Permission Changes (No-Code)

This guide covers how to do these changes from the admin UI only:

- Admins should see **Groups** and **Team Members**
- Agents should no longer see **AI Agent**

## Prerequisites

- You are logged in as an **Owner / superAdmin** account.
- Your account can access **Admin area > Roles**.

## 1) Let Admins See Groups and Team Members

This is controlled by the `agents.update` permission.

1. Go to **Admin area**.
2. Open **Roles**.
3. Edit the **Admins** role.
4. In permissions, enable:
   - **Agent management** (`agents.update`)
5. Save the role.

Expected result:

- Users with the **Admins** role can see/use Team pages (including members and groups) in dashboard/admin navigation where gated by `agents.update`.

## 2) Hide AI Agent from Agents

This is controlled by the `ai_agent.update` permission.

1. Go to **Admin area**.
2. Open **Roles**.
3. Edit the **Agents** role.
4. In permissions, disable:
   - **Manage AI Agent** (`ai_agent.update`)
5. Save the role.

Expected result:

- Users with the **Agents** role no longer see/access **AI Agent** menu/pages that require `ai_agent.update`.

## Verification Checklist

After saving both roles:

1. Log out and log back in (or hard refresh) as an **Admin** user.
2. Confirm **Team Members** and **Groups** are visible/accessible.
3. Log in as an **Agent** user.
4. Confirm **AI Agent** is no longer visible in menu and cannot be opened directly by URL.

## Notes

- These are **no-code** changes made entirely in the role permissions UI.
- If changes do not appear immediately, clear app cache/session and retry login.

## Files Referenced (Code Map)

These UI permission changes are done from the app, but these files define or gate the behavior:

- `common/foundation/resources/client/admin/roles/crupdate-role-page/crupdate-role-settings-panel.tsx`
  - Role edit UI with the permission selector used to add/remove permissions.
- `common/foundation/resources/defaults/permissions.php`
  - Default permission definitions (includes `agents.update` and `ai_agent.update`).
- `resources/defaults/default-settings.php`
  - Default sidebar menu items and permission gates:
  - Team menu uses `agents.update`.
  - AI Agent menu uses `ai_agent.update`.
- `resources/client/dashboard/team-routes.tsx`
  - Team area route guard: `AuthRoute permission="agents.update"`.
- `modules/ai/resources/client/ai-agent/ai-agent-routes.tsx`
  - AI Agent route tree under `/ai-agent`.
- `resources/client/dashboard/dashboard-layout/helpdesk-dashboard-sidebar.tsx`
  - Dashboard sidebar icon mapping for menu route actions.

## Routing Map

Use these paths when validating access after role permission updates:

- Role management UI:
  - `/admin/roles`
- Team pages (should be visible for Admins when `agents.update` is granted):
  - `/dashboard/team`
  - `/dashboard/team/members`
  - `/dashboard/team/groups`
  - `/dashboard/team/invites`
- AI Agent pages (should be hidden/inaccessible for Agents when `ai_agent.update` is removed):
  - `/dashboard/ai-agent`
  - `/dashboard/ai-agent/settings`
  - `/dashboard/ai-agent/knowledge`
  - `/dashboard/ai-agent/flows`
  - `/dashboard/ai-agent/tools`
