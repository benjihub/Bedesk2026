<?php

use App\Attributes\Controllers\AttributesController;
use App\Attributes\Controllers\AttributesListController;
use App\Billing\Controllers\AiBillingController;
use App\CannedReplies\Controllers\CannedRepliesController;
use App\Contacts\Controllers\CustomerProfileController;
use App\Contacts\Controllers\CustomersController;
use App\Contacts\Controllers\MergeCustomersController;
use App\Conversations\Agent\Controllers\AgentConversationListController;
use App\Conversations\Agent\Controllers\AgentConversationsController;
use App\Conversations\Agent\Controllers\AgentMessagesController;
use App\Conversations\Agent\Controllers\ConversationsAssigneeController;
use App\Conversations\Agent\Controllers\ConversationsGroupController;
use App\Conversations\Agent\Controllers\ConversationsSearchController;
use App\Conversations\Agent\Controllers\ConversationsStatusController;
use App\Conversations\Agent\Controllers\ConversationsAiPauseController;
use App\Conversations\Agent\Controllers\ConversationStatusesController;
use App\Conversations\Agent\Controllers\ConversationTagsController;
use App\Conversations\Agent\Controllers\ConversationViewsController;
use App\Conversations\Agent\Controllers\HelpDeskAutocompleteController;
use App\Conversations\Agent\Controllers\MergeConversationsController;
use App\Conversations\Agent\Controllers\OriginalReplyEmailController;
use App\Conversations\Agent\Controllers\RecentCustomerConversationsController;
use App\Conversations\Agent\Controllers\TicketMilestoneController;
use App\Conversations\Agent\Controllers\ViewListController;
use App\Conversations\Customer\Controllers\CustomerMessagesController;
use App\Conversations\Customer\Controllers\CustomerNewTicketPageDataController;
use App\Conversations\Customer\Controllers\CustomerTicketsController;
use App\HelpCenter\Controllers\HcActionsController;
use App\HelpCenter\Controllers\HcArticleAttachmentsController;
use App\HelpCenter\Controllers\HcArticleAuthorController;
use App\HelpCenter\Controllers\HcArticleController;
use App\HelpCenter\Controllers\HcArticleFeedbackController;
use App\HelpCenter\Controllers\HcArticleSearchController;
use App\HelpCenter\Controllers\HcCategoryController;
use App\HelpCenter\Controllers\HcLandingPageController;
use App\HelpCenter\Controllers\HelpCenterManagerController;
use App\Reports\Controllers\HelpdeskReportsController;
use App\Reports\Controllers\TicketMilestoneReportController;
use App\Team\Controllers\AgentInvitesController;
use App\Team\Controllers\AgentsController;
use App\Team\Controllers\CompactAgentsController;
use App\Team\Controllers\GroupsController;
use App\Team\Controllers\GroupAiAgentSettingsController;
use App\Team\Controllers\GroupPromotionsController;
use App\Team\Controllers\GroupSettingsController;
use App\Team\Controllers\PromotionsController;
use App\Triggers\Controllers\TriggerController;
use App\Webhooks\Controllers\EmailApiWebhookController;
use Common\Notifications\NotificationSubscriptionsController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'v1'], function() {
    Route::group(['middleware' => ['optionalAuth:sanctum', 'verified', 'verifyApiAccess']], function () {
        // AGENT CONVERSATIONS
        Route::get('helpdesk/agent/conversations', [AgentConversationsController::class, 'index']);
        Route::post('helpdesk/agent/conversations', [AgentConversationsController::class, 'store']);
        Route::put('helpdesk/agent/conversations/{id}', [AgentConversationsController::class, 'update']);
        Route::post('helpdesk/agent/conversations/merge', MergeConversationsController::class);
        Route::get('helpdesk/agent/conversations/{id}', [AgentConversationsController::class, 'show']);
        Route::delete('helpdesk/agent/conversations/{ids}', [AgentConversationsController::class, 'destroy']);
        Route::get('helpdesk/agent/conversations/{conversationId}/messages', [AgentMessagesController::class, 'index']);
        Route::post('helpdesk/agent/conversations/{conversationId}/messages', [AgentMessagesController::class, 'store']);
        Route::post('helpdesk/agent/conversations/{conversationId}/typing', [AgentMessagesController::class, 'typing']);
        Route::post('helpdesk/agent/messages/{messageId}/bigman/retry', [\App\Conversations\Agent\Controllers\BigmanController::class, 'retry']);
        Route::post('helpdesk/agent/conversations/status/change', [ConversationsStatusController::class, 'update']);
        Route::post('helpdesk/agent/conversations/ai/pause', [ConversationsAiPauseController::class, 'update']);
        Route::post('helpdesk/agent/conversations/assignee/change', [ConversationsAssigneeController::class, 'update']);
        Route::post('helpdesk/agent/conversations/group/change', [ConversationsGroupController::class, 'update']);
        Route::get('helpdesk/agent/conversations/recent/{userId}', RecentCustomerConversationsController::class);
        Route::get('helpdesk/agent/{agentId}/conversation-list', AgentConversationListController::class);

        // CUSTOMER CONVERSATIONS
        Route::get('helpdesk/customer/tickets', [CustomerTicketsController::class, 'index']);
        Route::get('helpdesk/customer/tickets/{id}', [CustomerTicketsController::class, 'show']);
        Route::get('helpdesk/customer/conversations/{conversationId}/messages', [CustomerMessagesController::class, 'index']);
        Route::post('helpdesk/customer/conversations/{conversationId}/messages', [CustomerMessagesController::class, 'store']);
        Route::post('helpdesk/customer/conversations/{id}/mark-as-solved', [CustomerTicketsController::class, 'markConversationAsSolved'])->withoutMiddleware(VerifyCsrfToken::class);
        Route::post('helpdesk/customer/tickets', [CustomerTicketsController::class, 'store']);
        Route::get('helpdesk/customer-new-ticket-page-config', CustomerNewTicketPageDataController::class);

        // CONVERSATION TAGS
        Route::post('helpdesk/conversations/tags/add', [ConversationTagsController::class, 'add']);
        Route::post('helpdesk/conversations/tags/remove', [ConversationTagsController::class, 'remove']);
        Route::get('helpdesk/conversations/{conversationId}/tags', [ConversationTagsController::class, 'index']);
        // expose conversation summary endpoint used by the client
        Route::get('helpdesk/conversations/{conversationId}/summary', [\App\Conversations\Agent\Controllers\ConversationSummaryController::class, 'show']);

        //REPLIES
        Route::get('helpdesk/agent/messages/{messageId}/email', [OriginalReplyEmailController::class, 'show']);
        Route::get('helpdesk/agent/messages/{messageId}/email/download', [OriginalReplyEmailController::class, 'download']);
        Route::put('helpdesk/agent/messages/{messageId}', [AgentMessagesController::class, 'update']);
        Route::delete('helpdesk/agent/messages/{messageId}', [AgentMessagesController::class, 'destroy']);

        // STATUSES
        Route::get('helpdesk/statuses/list', [ConversationStatusesController::class, 'listForConversation']);
        Route::get('helpdesk/statuses', [ConversationStatusesController::class, 'index']);
        Route::post('helpdesk/statuses', [ConversationStatusesController::class, 'store']);
        Route::put('helpdesk/statuses/{id}', [ConversationStatusesController::class, 'update']);
        Route::delete('helpdesk/statuses/{ids}', [ConversationStatusesController::class, 'destroy']);

        //CUSTOMERS
        Route::get('helpdesk/customers', [CustomersController::class, 'index']);
        Route::get('helpdesk/customers/{id}', [CustomerProfileController::class, 'show']);
        Route::put('helpdesk/customers/{id}', [CustomerProfileController::class, 'update']);
        Route::get('helpdesk/customers/{id}/conversations', [CustomerProfileController::class, 'conversations']);
        Route::post('helpdesk/customers/merge', MergeCustomersController::class);
        Route::delete('helpdesk/customers/{id}', [CustomersController::class, 'destroy']);

        //SEARCH
        Route::get('search/articles', HcArticleSearchController::class);
        Route::get('search/conversations', ConversationsSearchController::class);

        // VIEWS
        Route::get('helpdesk/inbox/views', ViewListController::class);
        Route::apiResource('helpdesk/views', ConversationViewsController::class);
        Route::post('helpdesk/views/reorder', [ConversationViewsController::class, 'reorder']);

        // GROUPS
        Route::get('helpdesk/groups', [GroupsController::class, 'index']);
        Route::get('helpdesk/groups/{groupId}', [GroupsController::class, 'show']);
        Route::post('helpdesk/groups', [GroupsController::class, 'store']);
        Route::put('helpdesk/groups/{groupId}', [GroupsController::class, 'update']);
        Route::delete('helpdesk/groups/{groupId}', [GroupsController::class, 'destroy']);

        // GROUP PROMOTIONS
        Route::get('helpdesk/groups/{groupId}/promotions', [GroupPromotionsController::class, 'index']);
        Route::post('helpdesk/groups/{groupId}/promotions', [GroupPromotionsController::class, 'store']);
        Route::put('helpdesk/groups/{groupId}/promotions/{promotionId}', [GroupPromotionsController::class, 'update']);
        Route::delete('helpdesk/groups/{groupId}/promotions/{promotionId}', [GroupPromotionsController::class, 'destroy']);

        // GROUP SETTINGS
        Route::get('helpdesk/groups/{groupId}/settings', [GroupSettingsController::class, 'show']);
        Route::put('helpdesk/groups/{groupId}/settings', [GroupSettingsController::class, 'update']);

        // GROUP AI RULES (AI AGENT SETTINGS OVERRIDES)
        Route::get('helpdesk/groups/{groupId}/ai-agent-settings', [GroupAiAgentSettingsController::class, 'show']);
        Route::put('helpdesk/groups/{groupId}/ai-agent-settings', [GroupAiAgentSettingsController::class, 'update']);

        // PROMOTIONS (ALL GROUPS)
        Route::get('helpdesk/promotions', [PromotionsController::class, 'index']);
        // DASHBOARD STATS
        Route::get('helpdesk/dashboard-stats', [\App\Team\Controllers\DashboardStatsController::class, 'index']);

        // BILLING
        Route::get('helpdesk/billing/summary', [AiBillingController::class, 'summary']);
        Route::get('helpdesk/billing/plans', [AiBillingController::class, 'plans']);
        Route::get('helpdesk/billing/payment-history', [AiBillingController::class, 'paymentHistory']);
        Route::post('helpdesk/billing/request-plan', [AiBillingController::class, 'requestPlan']);
        Route::post('helpdesk/billing/request-top-up', [AiBillingController::class, 'requestTopUp']);
        Route::post('helpdesk/billing/payment-requests/{paymentRequestId}/transaction', [AiBillingController::class, 'submitTransaction']);
        Route::post('helpdesk/billing/payment-requests/{paymentRequestId}/cancel', [AiBillingController::class, 'cancelPaymentRequest']);
        Route::get('helpdesk/admin/billing/accounts', [AiBillingController::class, 'adminAccounts']);
        Route::get('helpdesk/admin/billing/accounts/{accountId}', [AiBillingController::class, 'adminAccountSummary']);
        Route::post('helpdesk/admin/billing/payment-requests/{paymentRequestId}/confirm', [AiBillingController::class, 'confirmPayment']);
        Route::post('helpdesk/admin/billing/payment-requests/{paymentRequestId}/reject', [AiBillingController::class, 'rejectPayment']);
        Route::post('helpdesk/admin/billing/payment-requests/{paymentRequestId}/reconcile', [AiBillingController::class, 'reconcilePayment']);
        Route::post('helpdesk/admin/billing/top-ups/{topUpId}/expire', [AiBillingController::class, 'expireTopUp']);

        // AGENT INVITES
        Route::get('helpdesk/agents/invites', [AgentInvitesController::class, 'index']);
        Route::post('helpdesk/agents/invite/{inviteId}/resend', [AgentInvitesController::class, 'resend']);
        Route::post('helpdesk/agents/invite', [AgentInvitesController::class, 'store']);
        Route::delete('helpdesk/agents/invite/{inviteId}', [AgentInvitesController::class, 'destroy']);

        // AGENTS
        Route::get('helpdesk/agents', [AgentsController::class, 'index']);
        Route::post('helpdesk/agents', [AgentsController::class, 'store']);
        Route::get('helpdesk/agents/{agentId}', [AgentsController::class, 'show']);
        Route::put('helpdesk/agents/{agentId}', [AgentsController::class, 'update']);
        Route::get('helpdesk/compact-agents', CompactAgentsController::class);

        // CANNED REPLIES
        Route::apiResource('helpdesk/canned-replies', CannedRepliesController::class);

        // HELP CENTER
        Route::get('hc', HcLandingPageController::class);
        Route::get('hc/manager/categories', [HelpCenterManagerController::class, 'categories']);
        Route::get('hc/manager/categories/{categoryId}/sections', [HelpCenterManagerController::class, 'categories']);
        Route::get('hc/manager/sections/{sectionId}/articles', [HelpCenterManagerController::class, 'articles']);
        Route::post('hc/manager/sections/{sectionId}/articles/reorder', [HelpCenterManagerController::class, 'reorderArticles']);
        Route::post('hc/manager/categories/reorder', [HelpCenterManagerController::class, 'reorderCategories']);

        // HELP CENTER CATEGORIES
        Route::get('hc/sidenav/{categoryId}', [HcCategoryController::class, 'sidenavContent']);
        Route::get('hc/categories/{categoryId}', [HcCategoryController::class, 'show']);
        Route::post('hc/categories', [HcCategoryController::class, 'store']);
        Route::put('hc/categories/{id}', [HcCategoryController::class, 'update']);
        Route::delete('hc/categories/{id}', [HcCategoryController::class, 'destroy']);

        // HELP CENTER ARTICLES
        Route::get('hc/articles/{articleId}/download/{entryHash}', [HcArticleAttachmentsController::class, 'download']);
        Route::get('hc/articles/{categoryId}/{sectionId}/{articleId}', [HcArticleController::class, 'show']);
        Route::get('hc/articles/{articleId}', [HcArticleController::class, 'show']);
        Route::get('hc/articles', [HcArticleController::class, 'index']);
        Route::post('hc/articles', [HcArticleController::class, 'store']);
        Route::put('hc/articles/{article}', [HcArticleController::class, 'update']);
        Route::post('hc/articles/{article}/feedback', [HcArticleFeedbackController::class, 'store']);
        Route::delete('hc/articles/{id}', [HcArticleController::class, 'destroy']);
        Route::post('hc/articles/batch-action', [HcArticleController::class, 'performBatchAction']);

        // HELP CENTER AUTOCOMPLETE
        Route::get('helpdesk/normalized-models/article-authors', [HcArticleAuthorController::class, 'index']);
        Route::get('helpdesk/normalized-models/article-authors/{userId}', [HcArticleAuthorController::class, 'show']);

        //HElP CENTER IMPORT/EXPORT
        Route::post('hc/actions/import', [HcActionsController::class, 'import']);
        Route::get('hc/actions/export', [HcActionsController::class, 'export']);

        Route::get('helpdesk/normalized-models/tags', [HelpDeskAutocompleteController::class, 'tags']);
        Route::get('helpdesk/normalized-models/hc-categories', [HelpDeskAutocompleteController::class, 'hcCategories']);
        Route::get('helpdesk/normalized-models/agents', [HelpDeskAutocompleteController::class, 'agents']);
        Route::get('helpdesk/normalized-models/groups', [HelpDeskAutocompleteController::class, 'groups']);
        Route::get('helpdesk/normalized-models/roles', [HelpDeskAutocompleteController::class, 'roles']);
        Route::get('helpdesk/normalized-models/envato-items', [HelpDeskAutocompleteController::class, 'envatoItems']);
        Route::get('helpdesk/normalized-models/customer', [HelpDeskAutocompleteController::class, 'customers']);
        Route::get('helpdesk/normalized-models/customer/{id}', [HelpDeskAutocompleteController::class, 'customer']);

        //TRIGGERS
        Route::get('triggers', [TriggerController::class, 'index']);
        Route::get('triggers/config', [TriggerController::class, 'config']);
        Route::get('triggers/{trigger}', [TriggerController::class, 'show']);
        Route::post('triggers', [TriggerController::class, 'store']);
        Route::put('triggers/{trigger}', [TriggerController::class, 'update']);
        Route::delete('triggers/{ids}', [TriggerController::class, 'destroy']);

        // REPORTS
        Route::get('admin/tickets/{id}/milestones', [TicketMilestoneController::class, 'show']);
        Route::get('admin/reports/ticket-milestones', [TicketMilestoneReportController::class, 'index']);
        Route::get('reports/conversations/{type}', [HelpdeskReportsController::class, 'conversations']);
        Route::get('reports/agents', [HelpdeskReportsController::class, 'agents']);
        Route::get('reports/tags', [HelpdeskReportsController::class, 'tags']);
        Route::get('reports/search/{type}', [HelpdeskReportsController::class, 'search']);
        Route::get('reports/articles', [HelpdeskReportsController::class, 'articles']);

        // ATTRIBUTES
        Route::get('helpdesk/attributes/list', AttributesListController::class);
        Route::apiResource('helpdesk/attributes', AttributesController::class);

        //NOTIFICATIONS
        Route::apiResource('notification-subscription', NotificationSubscriptionsController::class, ['as' => 'apiNotifSubs']);

        //UPLOADS
        Route::get('uploads/{id}', '\Common\Files\Controllers\FileEntriesController@show');

        //TICKETS MAIL WEBHOOKS
        Route::post('tickets/mail/incoming', [EmailApiWebhookController::class, 'handleIncoming'])->withoutMiddleware(VerifyCsrfToken::class);
        Route::post('tickets/mail/failed', [EmailApiWebhookController::class,'handleFailed'])
            ->withoutMiddleware(VerifyCsrfToken::class);

    });
});
