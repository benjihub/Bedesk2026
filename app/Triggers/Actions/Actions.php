<?php namespace App\Triggers\Actions;

use App\Conversations\Models\Conversation;
use App\Triggers\Models\Trigger;
use App\Triggers\TriggersConfig;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class Actions
{
    public function execute(
        Conversation $conversation,
        Trigger $trigger,
    ): Conversation {
        foreach ($trigger->actions() as $actionConfig) {
            $action = $this->buildAction($actionConfig['name']);

            $conversation = $action->execute(
                $conversation,
                $actionConfig,
                $trigger,
            );

            //if action aborts triggers cycle (for example deletes conversation)
            //we need to bail instantly and not run any actions after it
            if ($this->abortsCycle([$actionConfig])) {
                break;
            }
        }

        return $conversation;
    }

    public function updatesConversation(iterable $actions): bool
    {
        $config = (new TriggersConfig())->get();
        foreach ($actions as $action) {
            $actionConfig = Arr::first(
                $config['actions'],
                fn($a, $name) => $name === $action['name'],
            );
            if (Arr::get($actionConfig, 'updates_conversation')) {
                return true;
            }
        }

        return false;
    }

    public function abortsCycle(iterable $actions): bool
    {
        $config = (new TriggersConfig())->get();
        foreach ($actions as $action) {
            $actionConfig = Arr::first(
                $config['actions'],
                fn($a, $name) => $name === $action['name'],
            );
            if (Arr::get($actionConfig, 'aborts_cycle')) {
                return true;
            }
        }

        return false;
    }

    protected function buildAction(string $actionName): TriggerActionInterface
    {
        $className = ucfirst(Str::camel($actionName)) . 'Action';

        return App::make(__NAMESPACE__ . '\\' . $className);
    }
}
