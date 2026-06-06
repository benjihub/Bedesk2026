<?php

namespace App\Conversations\Agent\Controllers;

use App\Conversations\Jobs\SendBankProofToBigman;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class BigmanController extends Controller
{
    public function retry(Request $request, $messageId)
    {
        try {
            $message = ConversationItem::find($messageId);
            if (!$message) {
                return response()->json(['message' => 'Message not found'], 404);
            }

            $data = is_array($message->data ?? null) ? $message->data : [];
            $bankProof = is_array($data['bank_proof'] ?? null) ? $data['bank_proof'] : null;
            if (!$bankProof || !is_array($bankProof)) {
                return response()->json(['message' => 'No bank_proof on message'], 422);
            }

            $conversation = Conversation::find($message->conversation_id);
            if (!$conversation) {
                return response()->json(['message' => 'Conversation not found'], 404);
            }

            // Dispatch the job again with the saved bankProof
            SendBankProofToBigman::dispatch($conversation->id, $message->id, $bankProof)->onQueue('bigman');

            return response()->json(['message' => 'BigMan check requeued']);
        } catch (\Throwable $e) {
            Log::warning('BigmanController::retry failed', ['error' => $e->getMessage(), 'message_id' => $messageId]);
            return response()->json(['message' => 'Internal error'], 500);
        }
    }
}
