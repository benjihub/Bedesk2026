<?php

use Illuminate\Support\Facades\Route;
use Livechat\Controllers\CampaignController;
use Livechat\Controllers\ChatTranscriptController;
use Livechat\Controllers\DashboardChatController;
use Livechat\Controllers\LivechatReportsController;
use Livechat\Controllers\UserPageVisitsController;

Route::group(['prefix' => 'v1'], function () {
    Route::group(['middleware' => ['optionalAuth:sanctum', 'verified', 'verifyApiAccess']], function () {
        // chats
        Route::get('lc/dashboard/chats/{chatId}/download-transcript', ChatTranscriptController::class);

        // chat users
        Route::get('helpdesk/agent/visits/{userId}', [UserPageVisitsController::class, 'index']);

        // campaigns
        Route::get('lc/campaigns', [CampaignController::class, 'index']);
        Route::get('lc/campaigns/{campaignId}', [CampaignController::class, 'show']);
        Route::get('lc/campaigns/{campaignId}/report', [CampaignController::class, 'report']);
        Route::post('lc/campaigns', [CampaignController::class, 'store']);
        Route::put('lc/campaigns/{campaignId}', [CampaignController::class, 'update']);
        Route::delete('lc/campaigns/{ids}', [CampaignController::class, 'destroy']);
        Route::get('lc/campaign-templates', [CampaignController::class, 'templates']);

        // reports
        Route::get('lc/reports/campaigns', [LivechatReportsController::class, 'campaigns']);
    });
});
