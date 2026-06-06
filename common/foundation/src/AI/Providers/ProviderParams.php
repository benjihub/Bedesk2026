<?php

namespace Common\AI\Providers;

use Common\AI\Chat\UserMessage;
use Illuminate\Support\Collection;

class ProviderParams
{
    public Collection|null $tools = null;

    public function __construct(
        public Collection|null $messages = null,
        public array|null $schema = null,
        public string|null $systemPrompt = null,
        public int|null $temperature = null,
        public int|null $maxTokens = null,
        public int $maxSteps = 3,
        public string|null $model = null,
        string|null $prompt = null,
        Collection|array|null $tools = null,
    ) {
        if ($prompt) {
            $this->setPrompt($prompt);
        }

        if ($tools) {
            $this->setTools($tools);
        }
    }

    public function setSchema(array $schema): static
    {
        $this->schema = $schema;
        return $this;
    }

    public function setMessages(Collection $messages): static
    {
        $this->messages = $messages;
        return $this;
    }

    public function setTools(array|Collection $tools): static
    {
        $this->tools = collect($tools);
        return $this;
    }

    public function setSystemPrompt(string $systemPrompt): static
    {
        $this->systemPrompt = $systemPrompt;
        return $this;
    }

    public function setPrompt(string $message): static
    {
        if (!$this->messages) {
            $this->messages = collect();
        }
        $this->messages->push(new UserMessage($message));
        return $this;
    }

    public function setTemperature(int $temperature): static
    {
        $this->temperature = $temperature;
        return $this;
    }

    public function setMaxTokens(int $maxTokens): static
    {
        $this->maxTokens = $maxTokens;
        return $this;
    }

    public function setMaxSteps(int $maxSteps): static
    {
        $this->maxSteps = $maxSteps;
        return $this;
    }

    public function setModel(string $model): static
    {
        $this->model = $model;
        return $this;
    }
}
