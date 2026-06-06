<?php

use App\CannedReplies\Models\CannedReply;
use App\Conversations\Models\ConversationItem;
use App\HelpCenter\Models\HcArticle;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::table('file_entry_models')
            ->where('model_type', HcArticle::MODEL_TYPE)
            ->where(function ($q) {
                $q->where('relation_type', 'access')->orWhereNull(
                    'relation_type',
                );
            })
            ->update(['relation_type' => 'attachments']);

        DB::table('file_entry_models')
            ->where('model_type', ConversationItem::MODEL_TYPE)
            ->where(function ($q) {
                $q->where('relation_type', 'access')->orWhereNull(
                    'relation_type',
                );
            })
            ->update(['relation_type' => 'attachments']);

        DB::table('file_entry_models')
            ->where('model_type', CannedReply::MODEL_TYPE)
            ->where(function ($q) {
                $q->where('relation_type', 'access')->orWhereNull(
                    'relation_type',
                );
            })
            ->update(['relation_type' => 'attachments']);

        DB::table('file_entry_models')
            ->where('model_type', 'aiAgentFlow')
            ->where(function ($q) {
                $q->where('relation_type', 'access')->orWhereNull(
                    'relation_type',
                );
            })
            ->update(['relation_type' => 'attachments']);
    }
};
