<?php

use App\Core\HelpDeskChannel;

Broadcast::channel(HelpDeskChannel::NAME, function (\App\Models\User $user) {
    return [
        'modelId' => $user->id,
        'modelType' => $user->type,
        'isAgent' => $user->isAgent(),
    ];
});
