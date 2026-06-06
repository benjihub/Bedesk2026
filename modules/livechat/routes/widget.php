<?php

use App\Conversations\Customer\Controllers\CustomerTicketsController;
use Illuminate\Broadcasting\BroadcastController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;
use Livechat\Controllers\ChatTranscriptController;
use Livechat\Controllers\WidgetBroadcastController;
use App\Team\Models\GroupSettings;
use Illuminate\Support\Str;
use Livechat\Widget\Controllers\WidgetActiveChatController;
use Livechat\Widget\Controllers\WidgetCampaignsController;
use Livechat\Widget\Controllers\WidgetChatMessagesController;
use Livechat\Widget\Controllers\WidgetConversationsController;
use Livechat\Widget\Controllers\WidgetHelpCenterController;
use Livechat\Widget\Controllers\WidgetHomeController;
use Livechat\Widget\Controllers\WidgetCustomerController;
use Livechat\Widget\Controllers\WidgetCustomerEmailController;
use Livechat\Widget\Controllers\WidgetCustomerExternalData as WidgetCustomerExternalData;
use Livechat\Widget\Controllers\WidgetCompactAgentsController;
use Livechat\Widget\Controllers\WidgetVisitsController;
use Livechat\Widget\Middleware\AuthenticateWidget;
use Common\Core\Middleware\VerifyCsrfToken as CommonVerifyCsrfToken;

//make sure widget and all widget/* routes are handled by widget router correctly
Route::group(['middleware' => ['web', AuthenticateWidget::class]], function() {
    Route::as('chatWidgetHome')->get('lc/widget', WidgetHomeController::class);
    Route::as('aiAgentPreviewMode')->get('lc/widget/ai-agent-preview-mode', WidgetHomeController::class);
    Route::get('lc/widget/{any}', WidgetHomeController::class)->where('any', '.*');

    // Friendly public link: /lc/{token} -> redirect to inline widget for that group.
    // Constrain token so we don't conflict with /lc/widget and similar paths.
    Route::get('lc/{token}', function (string $token) {
        $record = GroupSettings::query()->where('public_link_token', $token)->first();
        if (!$record) {
            abort(404);
        }

        $groupId = $record->group_id;
        if (!$groupId) {
            abort(404);
        }

        // Redirect to inline widget for this group (department=groupId).
        $query = http_build_query([
            'department' => $groupId,
            'inline' => 'true',
        ]);

        return redirect("/lc/widget?{$query}");
    })->where('token', '[A-Za-z0-9]{16,64}')
      ->name('groupLivechatPublicLink');

    Route::match(['GET', 'POST'], 'lc/widget/broadcasting/auth', [WidgetBroadcastController::class, 'authenticate']);
});

// Public widget API: do not require AuthenticateWidget or Sanctum session.
Route::group(['prefix' => 'api/v1/lc/widget', 'middleware' => ['web', AuthenticateWidget::class]], function () {

    Route::match(['GET', 'POST'], 'broadcasting/auth', [WidgetBroadcastController::class, 'authenticate']);

    // conversations
    Route::get('chats/active', WidgetActiveChatController::class);
    Route::get('conversations', [WidgetConversationsController::class, 'index']);
    Route::get('conversations/{chatId}', [WidgetConversationsController::class, 'show']);
    Route::post('tickets', [CustomerTicketsController::class, 'store']);
    Route::post('chats', [WidgetConversationsController::class, 'store']);
    Route::post('chats/{chatId}/submit-form-data', [WidgetConversationsController::class, 'submitFormData']);
    Route::get('chats/{chatId}/download-transcript', ChatTranscriptController::class);

    // messages
    Route::get('chats/{chatId}/messages', [WidgetChatMessagesController::class, 'index']);
    Route::post('chats/{chatId}/messages', [WidgetChatMessagesController::class, 'store']);
    Route::post('chats/{chatId}/typing', [WidgetChatMessagesController::class, 'typing']);

    // users
    Route::get('customer', [WidgetCustomerController::class, 'show']);
    Route::put('customers/email', [WidgetCustomerEmailController::class, 'update']);
    Route::post('customers/sync-external-data', WidgetCustomerExternalData::class);

    // agents
    Route::get('compact-agents', WidgetCompactAgentsController::class);

    // visits
    Route::post('visits', [WidgetVisitsController::class, 'store']);
    Route::post('visits/{visitId}/change-status', [WidgetVisitsController::class, 'changeStatus']);

    // campaigns
    Route::get('campaigns', [WidgetCampaignsController::class, 'index']);
    Route::post('campaigns/{campaignId}/imp', [WidgetCampaignsController::class, 'logImpression']);

    // help center
    Route::get('help-center-data', [WidgetHelpCenterController::class, 'helpCenterData']);
    Route::get('home-article-list', [WidgetHelpCenterController::class, 'homeArticleList']);
})->withoutMiddleware([CommonVerifyCsrfToken::class, VerifyCsrfToken::class]);
