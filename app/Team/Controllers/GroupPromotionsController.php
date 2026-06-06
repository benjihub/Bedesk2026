<?php

namespace App\Team\Controllers;

use App\Conversations\Models\Conversation;
use App\Team\Models\Group;
use App\Team\Models\GroupPromotion;
use Common\Core\BaseController;

class GroupPromotionsController extends BaseController
{
    public function index(int $groupId)
    {
        $this->authorize('index', Conversation::class);

        Group::query()->findOrFail($groupId);

        $promotions = GroupPromotion::query()
            ->where('group_id', $groupId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(GroupPromotion $promotion) => [
                'id' => $promotion->id,
                'group_id' => $promotion->group_id,
                'title' => $promotion->title,
                'description' => $promotion->description,
                'discount' => $promotion->discount,
                'code' => $promotion->code,
                'terms' => $promotion->terms,
                'how_to_claim' => $promotion->how_to_claim,
                'active' => $promotion->active,
                'created_at' => $promotion->created_at,
            ]);

        return $this->success(['promotions' => $promotions]);
    }

    public function store(int $groupId)
    {
        $this->authorize('store', Conversation::class);

        Group::query()->findOrFail($groupId);

        $data = request()->validate([
            'title' => 'required|string|max:191',
            'description' => 'nullable|string',
            'discount' => 'nullable|integer|min:0',
            'code' => 'nullable|string|max:191',
            'terms' => 'nullable|string',
            'how_to_claim' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $promotion = GroupPromotion::create([
            'group_id' => $groupId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'discount' => $data['discount'] ?? null,
            'code' => $data['code'] ?? null,
            'terms' => $data['terms'] ?? null,
            'how_to_claim' => $data['how_to_claim'] ?? null,
            'active' => $data['active'] ?? true,
        ]);

        return $this->success(['promotion' => $promotion]);
    }

    public function update(int $groupId, int $promotionId)
    {
        $this->authorize('store', Conversation::class);

        Group::query()->findOrFail($groupId);

        $promotion = GroupPromotion::query()
            ->where('group_id', $groupId)
            ->where('id', $promotionId)
            ->firstOrFail();

        $data = request()->validate([
            'title' => 'required|string|max:191',
            'description' => 'nullable|string',
            'discount' => 'nullable|integer|min:0',
            'code' => 'nullable|string|max:191',
            'terms' => 'nullable|string',
            'how_to_claim' => 'nullable|string',
            'active' => 'boolean',
        ]);

        $promotion->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'discount' => $data['discount'] ?? null,
            'code' => $data['code'] ?? null,
            'terms' => $data['terms'] ?? null,
            'how_to_claim' => $data['how_to_claim'] ?? null,
            'active' => $data['active'] ?? $promotion->active,
        ]);

        return $this->success(['promotion' => $promotion]);
    }

    public function destroy(int $groupId, int $promotionId)
    {
        $this->authorize('store', Conversation::class);
        $this->blockOnDemoSite();

        Group::query()->findOrFail($groupId);

        $promotion = GroupPromotion::query()
            ->where('group_id', $groupId)
            ->where('id', $promotionId)
            ->firstOrFail();

        $promotion->delete();

        return $this->success();
    }
}
