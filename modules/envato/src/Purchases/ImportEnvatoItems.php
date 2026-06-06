<?php

namespace Envato\Purchases;

use Envato\EnvatoApiClient;
use Envato\Models\EnvatoItem;

class ImportEnvatoItems
{
    public function execute(): array
    {
        $rawItems = (new EnvatoApiClient())->getAuthorItems();

        return array_map(
            fn($rawItem) => EnvatoItem::firstOrCreate(
                ['item_id' => $rawItem['id']],
                [
                    'name' => $rawItem['name'],
                    'item_id' => $rawItem['id'],
                    'image' => $rawItem['image'],
                ],
            ),
            $rawItems,
        );
    }
}
