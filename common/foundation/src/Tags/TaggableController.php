<?php namespace Common\Tags;

use Common\Core\BaseController;

class TaggableController extends BaseController
{
    public static array $beforeTagChangeCallbacks = [];
    public static array $afterTagChangeCallbacks = [];

    public function listTags(string $taggableType, int $taggableId)
    {
        $taggable = app(modelTypeToNamespace($taggableType))::findOrFail(
            $taggableId,
        );

        $this->authorize('show', $taggable);

        $builder = $taggable->tags();

        if ($notType = request('notType')) {
            $builder->where('tags.type', '!=', $notType);
        }

        if ($type = request('type')) {
            $builder->where('tags.type', $type);
        }

        $tags = $builder->limit(25)->get();

        return $this->success(['tags' => $tags]);
    }

    public function attachTag()
    {
        $data = $this->validate(request(), [
            'taggableIds' => 'required|array|min:1',
            'taggableType' => 'required|string',
            'tagName' => 'required|string|max:255',
            'tagType' => 'nullable|string',
            'userId' => 'nullable|integer',
        ]);

        $taggable = app(modelTypeToNamespace($data['taggableType']));
        $taggables = $taggable->whereIn('id', $data['taggableIds'])->get();
        $this->authorize(
            'update',
            $taggables->count() === 1
                ? $taggables[0]
                : [$taggable::class, $taggables],
        );

        foreach (self::$beforeTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        $tag = app(Tag::class)->insertOrRetrieve(
            [$data['tagName']],
            $data['tagType'] ?? null,
            $data['userId'] ?? null,
        )[0];

        $taggable->attachTag(
            $tag->id,
            $data['taggableIds'],
            $data['userId'] ?? null,
        );

        foreach (self::$afterTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        return $this->success([
            'tag' => $tag,
        ]);
    }

    public function detachTag()
    {
        $data = $this->validate(request(), [
            'taggableIds' => 'required|array',
            'taggableType' => 'required|string',
            'tagId' => 'required|integer',
        ]);

        $taggable = app(modelTypeToNamespace($data['taggableType']));
        $taggables = $taggable->whereIn('id', $data['taggableIds'])->get();
        $this->authorize(
            'update',
            $taggables->count() === 1
                ? $taggables[0]
                : [$taggable::class, $taggables],
        );

        foreach (self::$beforeTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        $taggable->detachTag($data['tagId'], $data['taggableIds']);

        foreach (self::$afterTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        return $this->success();
    }

    public function syncTags()
    {
        $data = $this->validate(request(), [
            'taggableIds' => 'required|array',
            'taggableType' => 'required|string',
            'tagIds' => 'required|array',
            'userId' => 'nullable|integer',
            'detach' => 'nullable|boolean',
        ]);

        $taggable = app(modelTypeToNamespace($data['taggableType']));
        $taggables = $taggable->whereIn('id', $data['taggableIds'])->get();
        $this->authorize(
            'update',
            $taggables->count() === 1
                ? $taggables[0]
                : [$taggable::class, $taggables],
        );

        foreach (self::$beforeTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        $ids = collect($data['tagIds'])->mapWithKeys(
            fn($id) => [$id => ['user_id' => $data['userId'] ?? null]],
        );

        foreach ($taggables as $taggable) {
            $taggable->tags()->sync($ids, $data['detach'] ?? false);
        }

        foreach (self::$afterTagChangeCallbacks as $callback) {
            $callback($taggables);
        }

        return $this->success();
    }
}
