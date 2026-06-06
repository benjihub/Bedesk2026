<?php

namespace App\Demo;

use App\Attributes\Models\CustomAttribute;
use App\HelpCenter\Models\HcCategory;

class CreateDemoFields
{
    public function execute()
    {
        $this->updateCategoryField();

        $data = [
            [
                'name' => 'Phone',
                'key' => 'phone',
                'type' => 'user',
                'format' => 'phone',
                'permission' => 'customerCanEdit',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        CustomAttribute::insert($data);
    }

    protected function updateCategoryField()
    {
        $categoryField = CustomAttribute::where('key', 'category')->first();

        $hcCategories = HcCategory::get();

        $config = [
            'options' => [
                [
                    'label' => 'Shipping issues',
                    'value' => 'shipping',
                    'hcCategories' => [
                        $hcCategories
                            ->where('name', 'Shipping Methods')
                            ->first()->id,
                    ],
                ],
                [
                    'label' => 'Subscriptions and billing',
                    'value' => 'payment',
                    'hcCategories' => [
                        $hcCategories->where('name', 'Troubleshooting')->first()
                            ->id,
                    ],
                ],
                [
                    'label' => 'Installation',
                    'value' => 'installation',
                    'hcCategories' => [
                        $hcCategories->where('name', 'Getting Started')->first()
                            ->id,
                    ],
                ],
                [
                    'label' => 'Settings & configuration',
                    'value' => 'configuration',
                    'hcCategories' => [
                        $hcCategories->where('name', 'Customization')->first()
                            ->id,
                    ],
                ],
            ],
        ];

        $categoryField->update([
            'customer_name' => 'Hi, what can we help you with?',
            'config' => $config,
        ]);
    }
}
