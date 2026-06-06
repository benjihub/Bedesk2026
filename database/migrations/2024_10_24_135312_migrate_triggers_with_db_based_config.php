<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $triggers = DB::table('triggers')
            ->get()
            ->filter(fn($trigger) => !$trigger->config);

        if ($triggers->isEmpty()) {
            return;
        }

        $actions = DB::table('actions')->get();
        $conditions = DB::table('conditions')->get();
        $operators = DB::table('operators')->get();
        $triggerAction = DB::table('trigger_action')->get();
        $triggerCondition = DB::table('trigger_condition')->get();

        foreach ($triggers as $trigger) {
            $newActions = $triggerAction->where('trigger_id', $trigger->id)->map(
                fn($ta) => [
                    'name' => $this->mapActionName(
                        $actions->first(fn($a) => $a->id === $ta->action_id)
                            ->name,
                    ),
                    'value' => json_decode($ta->action_value, true),
                ],
            )->values();

            $newConditions = $triggerCondition
                ->where('trigger_id', $trigger->id)
                ->map(
                    fn($tc) => [
                        'name' => $this->mapConditionName(
                            $conditions->firstWhere('id', $tc->condition_id)
                                ->type,
                        ),
                        'operator' => $operators->firstWhere(
                            'id',
                            $tc->operator_id,
                        )->name,
                        'value' => $this->mapConditionValue(
                            $tc->condition_value,
                        ),
                        'match_type' => $tc->match_type,
                    ],
                )->values();

            DB::table('triggers')
                ->where('id', $trigger->id)
                ->update([
                    'config' => [
                        'actions' => $newActions,
                        'conditions' => $newConditions,
                    ],
                ]);
        }
    }

    protected function mapConditionValue(mixed $value)
    {
        return match ($value) {
            'ticket_updated' => 'conversation_updated',
            'ticket_created' => 'conversation_created',
            default => $value,
        };
    }

    protected function mapConditionName(string $name): string
    {
        $newName = match ($name) {
            'ticket:body' => 'conversation:body',
            'ticket:status' => 'conversation:status',
            'ticket:attachments' => 'conversation:attachments',
            'ticket:assignee' => 'conversation:assignee',
            default => $name,
        };

        return str_replace(' ', '_', $newName);
    }

    protected function mapActionName(string $name): string
    {
        return match ($name) {
            'add_note_to_ticket' => 'add_note_to_conversation',
            'change_ticket_status' => 'change_conversation_status',
            'assign_ticket_to_agent' => 'assign_conversation_to_agent',
            'add_tags_to_ticket' => 'add_tags_to_conversation',
            'remove_tags_from_ticket' => 'remove_tags_from_conversation',
            'delete_ticket' => 'delete_conversation',
            default => $name,
        };
    }
};
