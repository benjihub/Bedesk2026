<?php

namespace Common\AI\Tools;

abstract class BaseTool
{
    public string $name;
    public string $description;
    public array $params = [];

    abstract public function execute(?array $params = null): string;

    public function getParams(): array
    {
        return $this->params;
    }
}
