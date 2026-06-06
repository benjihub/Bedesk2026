<?php

namespace Common\Settings\Events;

class SettingsSaved
{
    public function __construct(
        public array $dbSettings,
        public array $envSettings,
    ) {
    }
}
