<?php

namespace Common\Core\Resources;

use Common\Core\Resources\PaginatedResourceCollection;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;

class BaseJsonResource extends JsonResource
{
    /**
     * @param  mixed  $resource
     * @return AnonymousResourceCollection
     */
    public static function paginated($resource)
    {
        return new PaginatedResourceCollection($resource, static::class);
    }
}
