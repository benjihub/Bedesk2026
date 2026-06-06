<?php

namespace Common\Tags;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Facades\DB;

trait Taggable
{
    public function attachTag(
        string|int $tagId,
        array|null $taggableIds = null,
        int|null $userId = null,
    ): void {
        $taggableIds = $taggableIds ?? [$this->id];

        $rows = DB::table('taggables')
            ->whereIn('taggable_id', $taggableIds)
            ->where('tag_id', $tagId)
            ->where('taggable_type', static::MODEL_TYPE)
            ->get();

        // remove taggable ids that already have specified tag attached
        foreach ($rows as $existingRel) {
            $key = array_search($existingRel->taggable_id, $taggableIds);
            if ($key !== false) {
                unset($taggableIds[$key]);
            }
        }

        $data = array_map(
            fn($id) => [
                'tag_id' => $tagId,
                'taggable_id' => $id,
                'taggable_type' => static::MODEL_TYPE,
                'user_id' => $userId,
            ],
            $taggableIds,
        );

        static::whereIn('id', $taggableIds)->update(['updated_at' => now()]);

        DB::table('taggables')->insert($data);
    }

    public function detachTag(
        string|int $tagId,
        array $taggableIds = null,
    ): void {
        $taggableIds = $taggableIds ?? [$this->id];
        DB::table('taggables')
            ->whereIn('taggable_id', $taggableIds)
            ->where('tag_id', $tagId)
            ->where('taggable_type', static::MODEL_TYPE)
            ->delete();
        static::whereIn('id', $taggableIds)->update(['updated_at' => now()]);
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany($this->getTagModel(), 'taggable')->select([
            'tags.id',
            'tags.name',
            'tags.display_name',
            'tags.type',
        ]);
    }

    protected function scopeWhereTag(
        Builder $builder,
        string $tag,
        string $operator = '=',
    ): Builder {
        return $builder->whereHas('tags', function (Builder $tb) use (
            $tag,
            $operator,
        ) {
            $tb->where('name', $operator, $tag);
        });
    }

    public function getTagModel(): string
    {
        return class_exists('App\Models\Tag') ? 'App\Models\Tag' : Tag::class;
    }
}
