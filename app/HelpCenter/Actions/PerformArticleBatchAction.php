<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;

class PerformArticleBatchAction
{
    public function execute(array $articleIds, string $action, array $data)
    {
        switch ($action) {
            case 'changeArticleStatus':
                HcArticle::whereIn('id', $articleIds)->update([
                    'draft' => $data['status'] === 'published' ? false : true,
                ]);
                break;
            case 'changeVisibility':
                HcArticle::whereIn('id', $articleIds)->update([
                    'visible_to_role' => $data['roleId'],
                ]);
                break;
            default:
                throw new \Exception('Invalid action');
        }
    }
}
