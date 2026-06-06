<?php

namespace Common\Core\Bootstrap;

use Illuminate\Support\Collection;

interface BootstrapData
{
    public function getEncoded(): string;

    public function init(): self;

    public function getThemes(): Collection;
}
