<?php namespace App\Triggers\Conditions;

use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class Conditions
{
    /**
     * Check if specified conversation meets triggers conditions. If true, trigger action should be fired.
     */
    public function areMet(
        Trigger $trigger,
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate = null,
    ): bool {
        if ($trigger->conditions()->isEmpty()) {
            return false;
        }

        return $this->conditionsWithTypeAllAreMet(
            $trigger->conditions(),
            $conversation,
            $conversationDataBeforeUpdate,
        ) &&
            $this->conditionsWithTypeAnyAreMet(
                $trigger->conditions(),
                $conversation,
                $conversationDataBeforeUpdate,
            );
    }

    /**
     * Check if all conditions with match type 'all' are met.
     */
    private function conditionsWithTypeAllAreMet(
        Collection $conditions,
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate = null,
    ): bool {
        $conditions = $this->filterConditionsByMatchType($conditions, 'all');

        if ($conditions->isEmpty()) {
            return true;
        }

        foreach ($conditions as $condition) {
            if (
                !$this->conditionIsMet(
                    $condition,
                    $conversation,
                    $conversationDataBeforeUpdate,
                )
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if either of conditions with match type 'any' are met.
     */
    private function conditionsWithTypeAnyAreMet(
        Collection $conditions,
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate = null,
    ): bool {
        $conditions = $this->filterConditionsByMatchType($conditions, 'any');

        if ($conditions->isEmpty()) {
            return true;
        }

        foreach ($conditions as $condition) {
            if (
                $this->conditionIsMet(
                    $condition,
                    $conversation,
                    $conversationDataBeforeUpdate,
                )
            ) {
                return true;
            }
        }

        return false;
    }

    public function conditionIsMet(
        array $condition,
        Conversation $conversation,
        array|null $conversationDataBeforeUpdate = null,
    ): bool {
        return $this->loadCondition($condition['name'])->isMet(
            $conversation,
            $conversationDataBeforeUpdate,
            $condition['operator'],
            $condition['value'],
        );
    }

    private function filterConditionsByMatchType(
        Collection $conditions,
        string $matchType,
    ): Collection {
        return $conditions->filter(
            fn($condition) => $condition['match_type'] === $matchType,
        );
    }

    public function loadCondition(string $conditionType): BaseCondition
    {
        $className = $this->getConditionClassName($conditionType);

        $folder = ucfirst(explode(':', $conditionType)[0]);

        return App::make(__NAMESPACE__ . '\\' . $folder . '\\' . $className);
    }

    private function getConditionClassName(string $conditionType): string
    {
        $conditionType = Str::camel($conditionType);
        $parts = explode(':', $conditionType);
        $parts[1] = ucfirst($parts[1]);
        return ucfirst(implode('', $parts)) . 'Condition';
    }
}
