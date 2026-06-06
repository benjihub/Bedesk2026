<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcCategory;

class HcCategoryLoader
{
    public function loadData(): array
    {
        $categoryId =
            request()->route('sectionId') ?? request()->route('categoryId');
        $category = HcCategory::findOrFail($categoryId);

        $data = ['category' => $category, 'loader' => 'categoryPage'];

        $data['categoryNav'] = (new HcArticleLoader())->loadCategoryNav(
            $category->parent_id ?? $category->id,
        );

        if ($category->is_section) {
            $category->load('parent');
        }

        return [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'image' => $category->image,
                'description' => $category->description,
                'is_section' => $category->is_section,
                'parent_id' => $category->parent_id,
                'hide_from_structure' => $category->hide_from_structure,
                'parent' => $category->parent
                    ? [
                        'id' => $category->parent->id,
                        'name' => $category->parent->name,
                        'hide_from_structure' =>
                            $category->parent->hide_from_structure,
                    ]
                    : null,
            ],
            'categoryNav' => $data['categoryNav'],
        ];
    }
}
