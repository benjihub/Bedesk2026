<?php

use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Triggers\Models\Trigger;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $triggers = Trigger::all();
        $statuses = ConversationStatus::all();

        if ($statuses->isEmpty()) {
            return;
        }

        $statusNamesToReplace = [
            'open' => $statuses
                ->where('category', Conversation::STATUS_OPEN)
                ->first()->id,
            'closed' => $statuses
                ->where('category', Conversation::STATUS_CLOSED)
                ->first()->id,
            'pending' => $statuses
                ->where('category', Conversation::STATUS_PENDING)
                ->first()->id,
            'locked' => $statuses
                ->where('category', Conversation::STATUS_LOCKED)
                ->first()->id,
        ];

        foreach ($triggers as $trigger) {
            $jsonString = json_encode($trigger->config);

            $jsonString = str_replace('ticket:', 'conversation:', $jsonString);

            foreach ($statusNamesToReplace as $name => $id) {
                $jsonString = str_replace(
                    '"status_name":"' . $name . '"',
                    '"status_id":' . $id,
                    $jsonString,
                );
            }

            $trigger->config = json_decode($jsonString, true);
            $trigger->save();
        }
    }
};
