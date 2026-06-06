<?php

namespace Livechat\Widget\Users;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WidgetCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latestSession = $this->userSessions()
            ->orderBy('updated_at', 'desc')
            ->first();

        $this->loadCount('pageVisits');
        $this->load('secondaryEmail');

        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'gender' => $this->gender,
            'image' => $this->image,
            'timezone' => $this->timezone,
            'language' => $this->language,
            'banned_at' => $this->banned_at,
            'page_visits_count' => $this->page_visits_count,
            'is_returning' => $this->page_visits_count > 1,
            'created_at' => $this->created_at,

            // from session
            'country' => $latestSession?->country,
            'city' => $latestSession?->city,
            'device' => $latestSession?->device,
            'browser' => $latestSession?->browser,
            'platform' => $latestSession?->platform,

            // attributes
            'attributes' => $this->customAttributes->pluck('value', 'key'),
        ];
    }
}
