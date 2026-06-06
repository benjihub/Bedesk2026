<?php

namespace App\Attributes\Controllers;

use App\Attributes\Models\CustomAttribute;
use Common\Core\BaseController;

class AttributesListController extends BaseController
{
    public function __invoke()
    {
        $for = request('for', 'customer');
        $attributeIds = request('attributeIds')
            ? explode(',', request('attributeIds'))
            : null;
        $type = request('type');
        $permission = request(
            'permission',
            $for === 'customer' ? CustomAttribute::PERMISSION_USER_CAN_EDIT : null,
        );

        $attributes = CustomAttribute::query()
            ->when($attributeIds, fn($q) => $q->whereIn('id', $attributeIds))
            ->when(
                !$attributeIds && $permission,
                fn($q) => $q->where('permission', $permission),
            )
            ->when($type, fn($q) => $q->where('type', $type))
            ->orderBy('internal', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn(CustomAttribute $attribute) => $attribute->toCompactArray($for));

        return $this->success(['attributes' => $attributes]);
    }
}
