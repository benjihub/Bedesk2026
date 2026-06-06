# Changed Files

## Milestone Logging
- `database/migrations/2026_05_08_000001_create_ticket_event_logs_table.php`
- `app/Conversations/Models/TicketEventLog.php`
- `app/Conversations/Actions/TicketEventLogger.php`
- `app/Conversations/Actions/GetTicketMilestones.php`
- `app/Conversations/Listeners/LogTicketCreated.php`
- `app/Conversations/Listeners/LogTicketFirstReply.php`
- `app/Conversations/Listeners/LogTicketMilestonesFromConversationUpdate.php`
- `app/Conversations/Agent/Controllers/TicketMilestoneController.php`
- `app/Reports/Controllers/TicketMilestoneReportController.php`
- `resources/client/dashboard/conversations/conversation-page/details-sidebar/ticket-milestones-panel.tsx`
- `resources/client/dashboard/reports/ticket-milestones-report-page.tsx`

## Conversation Lifecycle
- `app/Conversations/Models/Conversation.php`
- `app/Providers/AppServiceProvider.php`
- `routes/api.php`
- `resources/client/dashboard/conversation.ts`
- `resources/client/dashboard/helpdesk-queries.ts`
- `resources/client/dashboard/conversations/conversation-page/details-sidebar/conversation-details-sidebar.tsx`
- `resources/client/dashboard/reports/helpdesk-reports-routes.tsx`
- `resources/client/dashboard/reports/layout/report-layout.tsx`

## Assignment And Queue
- `app/Conversations/Agent/Actions/ConversationsAssigner.php`
- `app/Conversations/Agent/Actions/SubmitMessageAsAgent.php`
- `app/Conversations/Agent/Controllers/AgentMessagesController.php`
- `app/Conversations/Events/ConversationMessageCreated.php`

## Earlier Session Changes
- `resources/defaults/permissions.php`
- `resources/defaults/default-settings.php`
- `resources/client/dashboard/dashboard-routes.tsx`
- `resources/client/dashboard/dashboard-layout/helpdesk-dashboard-sidebar.tsx`
- `common/foundation/src/CommonServiceProvider.php`
- `common/foundation/src/Core/Policies/SettingPolicy.php`
- `common/foundation/src/Settings/Manager/SettingsController.php`
- `modules/ai/src/Controllers/AiAgentSettingsController.php`
- `modules/ai/resources/client/ai-agent/ai-agent-routes.tsx`
- `modules/ai/resources/client/ai-agent/ai-agent-page-header.tsx`
- `modules/ai/resources/client/ai-agent/settings/settings-page.tsx`
- `app/Conversations/Policies/ConversationPolicy.php`
- `app/Conversations/Agent/Actions/ConversationListLoader.php`
- `app/Conversations/Agent/Actions/InboxViewsLoader.php`
- `app/Conversations/Agent/Controllers/ConversationsSearchController.php`
- `app/Conversations/Agent/Controllers/AgentConversationsController.php`
- `app/Team/Controllers/AgentsController.php`
- `database/migrations/2026_05_01_000001_update_operational_role_permissions.php`
- `app/Team/Models/GroupRotationState.php`
- `app/Team/Traits/CanBeAgent.php`
- `app/Models/User.php`
- `app/Conversations/Listeners/QueueDrainOnConversationClosed.php`
- `app/Conversations/Listeners/QueueDrainOnReassignment.php`
- `app/Team/Models/AgentSettings.php`
- `app/Demo/CreateDemoAgents.php`
- `database/migrations/2026_05_05_000001_update_default_agent_assignment_limit.php`
- `common/foundation/src/Auth/Controllers/UserSessionsController.php`
- `common/foundation/src/Auth/UserSession.php`
