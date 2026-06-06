<?php

use Ai\Controllers\AiAgentSettingsController;
use Ai\Controllers\AiAgentKnowledgeController;
use Ai\Controllers\AiAgentStatusController;
use Ai\Controllers\AiAgentSnippetsController;
use Ai\Controllers\AiAgentDocumentsController;
use Ai\Controllers\AiAgentWebsitesController;
use Ai\Controllers\AiAgentWebpagesController;
use Ai\Controllers\AiAgentFlowsController;
use Ai\Controllers\AiAgentToolsController;
use Ai\Controllers\AiAgentsController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'v1'], function () {
    Route::group(['middleware' => ['optionalAuth:sanctum', 'verified', 'verifyApiAccess']], function () {
        // Settings
        Route::get('lc/ai-agent/settings', [AiAgentSettingsController::class, 'index']);
        Route::put('lc/ai-agent/settings', [AiAgentSettingsController::class, 'update']);

        // Status
        Route::get('lc/ai-agent/status', [AiAgentStatusController::class, 'index']);
        
        // Knowledge
        Route::get('lc/ai-agent/knowledge', [AiAgentKnowledgeController::class, 'index']);
        
        // Snippets
        Route::get('lc/ai-agent/snippets', [AiAgentSnippetsController::class, 'index']);
        Route::get('lc/ai-agent/snippets/{id}', [AiAgentSnippetsController::class, 'show']);
        Route::post('lc/ai-agent/snippets', [AiAgentSnippetsController::class, 'store']);
        Route::put('lc/ai-agent/snippets/{id}', [AiAgentSnippetsController::class, 'update']);
        Route::delete('lc/ai-agent/snippets/{ids}', [AiAgentSnippetsController::class, 'destroy']);
        
        // Documents
        Route::get('lc/ai-agent/documents', [AiAgentDocumentsController::class, 'index']);
        Route::get('lc/ai-agent/documents/{id}', [AiAgentDocumentsController::class, 'show']);
        Route::post('lc/ai-agent/documents', [AiAgentDocumentsController::class, 'store']);
        Route::put('lc/ai-agent/documents/{id}', [AiAgentDocumentsController::class, 'update']);
        Route::delete('lc/ai-agent/documents/{ids}', [AiAgentDocumentsController::class, 'destroy']);
        
        // Websites
        Route::get('lc/ai-agent/websites', [AiAgentWebsitesController::class, 'index']);
        Route::get('lc/ai-agent/websites/{id}', [AiAgentWebsitesController::class, 'show']);
        Route::post('lc/ai-agent/websites', [AiAgentWebsitesController::class, 'store']);
        Route::put('lc/ai-agent/websites/{id}', [AiAgentWebsitesController::class, 'update']);
        Route::delete('lc/ai-agent/websites/{ids}', [AiAgentWebsitesController::class, 'destroy']);
        
        // Webpages (nested under websites)
        Route::get('lc/ai-agent/websites/{websiteId}/webpages', [AiAgentWebpagesController::class, 'index']);
        Route::get('lc/ai-agent/websites/{websiteId}/webpages/{webpageId}', [AiAgentWebpagesController::class, 'show']);
        Route::delete('lc/ai-agent/websites/{websiteId}/webpages/{ids}', [AiAgentWebpagesController::class, 'destroy']);
        
        // Flows
        Route::get('lc/ai-agent/flows', [AiAgentFlowsController::class, 'index']);
        Route::get('lc/ai-agent/flows/list', [AiAgentFlowsController::class, 'list']);
        Route::get('lc/ai-agent/flows/{id}', [AiAgentFlowsController::class, 'show']);
        Route::get('lc/ai-agent/flows/{id}/attachments', [AiAgentFlowsController::class, 'attachments']);
        Route::post('lc/ai-agent/flows', [AiAgentFlowsController::class, 'store']);
        Route::put('lc/ai-agent/flows/{id}', [AiAgentFlowsController::class, 'update']);
        Route::delete('lc/ai-agent/flows/{ids}', [AiAgentFlowsController::class, 'destroy']);
        
        // Tools
        Route::get('lc/ai-agent/tools', [AiAgentToolsController::class, 'index']);
        Route::get('lc/ai-agent/tools/list', [AiAgentToolsController::class, 'list']);
        Route::get('lc/ai-agent/tools/{id}', [AiAgentToolsController::class, 'show']);
        Route::post('lc/ai-agent/tools/test-request', [AiAgentToolsController::class, 'testRequest']);
        Route::post('lc/ai-agent/tools', [AiAgentToolsController::class, 'store']);
        Route::put('lc/ai-agent/tools/{id}', [AiAgentToolsController::class, 'update']);
        Route::delete('lc/ai-agent/tools/{ids}', [AiAgentToolsController::class, 'destroy']);
        
        // Agents
        Route::get('lc/ai-agent/agents', [AiAgentsController::class, 'index']);
        Route::get('lc/ai-agent/agents/{agent}', [AiAgentsController::class, 'show']);
        Route::post('lc/ai-agent/agents', [AiAgentsController::class, 'store']);
        Route::put('lc/ai-agent/agents/{agent}', [AiAgentsController::class, 'update']);
        Route::delete('lc/ai-agent/agents/{ids}', [AiAgentsController::class, 'destroy']);
    });
});
