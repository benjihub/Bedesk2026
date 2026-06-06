<?php

namespace App\HelpCenter\Actions;

use Ai\AiAgent\Ingest\Parsing\HtmlToMarkdown;
use App\HelpCenter\Models\HcCategory;

class ExportCategoryAsMarkdown
{
    protected string $text = '';

    public function __construct(protected int $categoryId) {}

    public function execute(): string
    {
        $category = HcCategory::with([
            'sections' => fn($q) => $q->with(
                'articles',
                fn($q) => $q->select('*'),
            ),
        ])->findOrFail($this->categoryId);

        foreach ($category->sections as $section) {
            $this->text .= "Category Title: {$section->name}\n\n";
            foreach ($section->articles as $article) {
                $this->text .= "Article Title: {$article->title}\n\n";
                $this->text .=
                    (new HtmlToMarkdown())->execute($article->body) .
                    "\n\n---\n\n";
            }
        }

        file_put_contents(storage_path('app/export.md'), $this->text);

        return $this->text;
    }
}
