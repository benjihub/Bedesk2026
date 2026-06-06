<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Conversations\Traits\BuildsConversationResources;
use App\Team\Models\GroupPromotion;
use Common\Core\BaseController;

class PromotionsController extends BaseController
{
    use BuildsConversationResources;

    public function index()
    {
        $this->authorize('index', Conversation::class);

        $orderBy = request('orderBy', 'group_promotions.created_at');
        $orderDir = request('orderDir', 'desc');
        $query = request('query', '');

        $pagination = GroupPromotion::query()
            ->select(['group_promotions.*', 'groups.name as group_name'])
            ->join('groups', 'groups.id', '=', 'group_promotions.group_id')
            ->when($query, function ($builder) use ($query) {
                $builder->where(function ($q) use ($query) {
                    $q->where('group_promotions.title', 'like', "%{$query}%")
                        ->orWhere('group_promotions.code', 'like', "%{$query}%");
                });
            })
            ->orderBy($orderBy, $orderDir)
            ->simplePaginate();

        $data = collect($pagination->items())->map(fn($promotion) => [
            'id' => $promotion->id,
            'group_id' => $promotion->group_id,
            'group_name' => $promotion->group_name,
            'title' => $promotion->title,
            'description' => $promotion->description,
            'discount' => $promotion->discount,
            'code' => $promotion->code,
            'terms' => $promotion->terms,
            'how_to_claim' => $promotion->how_to_claim,
            'active' => $promotion->active,
            'created_at' => $promotion->created_at,
        ]);

        return $this->success([
            'pagination' => $this->buildSimplePagination($pagination, $data),
        ]);
    }
}
