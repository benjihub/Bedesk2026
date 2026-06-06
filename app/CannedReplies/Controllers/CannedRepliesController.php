<?php namespace App\CannedReplies\Controllers;

use App\CannedReplies\Actions\BuildCannedRepliesList;
use App\CannedReplies\Models\CannedReply;
use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Common\Tags\Tag;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CannedRepliesController extends BaseController
{
    public function index()
    {
        $this->authorize('index', CannedReply::class);

        $params = request()->all();
        $params['perPage'] = $params['perPage'] ?? 30;

        $builder = CannedReply::with(['attachments', 'tags', 'user']);

        if (request('forCurrentUser')) {
            $builder->forCurrentUser();
        }

        $pagination = (new Datasource($builder, $params))->paginate();

        return $this->success([
            'pagination' => (new BuildCannedRepliesList())->execute(
                $pagination,
            ),
        ]);
    }

    public function show(int $replyId)
    {
        $reply = CannedReply::with(['attachments', 'tags'])->findOrFail(
            $replyId,
        );

        $this->authorize('show', $reply);

        return $this->success(['reply' => $reply]);
    }

    public function store()
    {
        $this->authorize('store', CannedReply::class);

        $userId = Auth::id();

        $data = $this->validate(request(), [
            'body' => 'required|string|min:3',
            'shared' => 'required|boolean',
            'name' => "required|string|min:3|max:255|unique:canned_replies,name,NULL,id,user_id,
                $userId",
            'shortcut' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^#?[A-Za-z0-9_-]+$/',
                Rule::unique('canned_replies', 'shortcut'),
            ],
            'groupId' => 'int|exists:groups,id',
            'attachments' => 'array|max:5|exists:file_entries,id',
            'tags' => 'array|max:10',
            'tags.*' => 'string',
        ]);

        $shortcut = isset($data['shortcut']) && is_string($data['shortcut'])
            ? trim($data['shortcut'])
            : null;
        if ($shortcut === '') {
            $shortcut = null;
        }
        if ($shortcut && !str_starts_with($shortcut, '#')) {
            $shortcut = "#{$shortcut}";
        }

        $cannedReply = CannedReply::create([
            'body' => $data['body'],
            'name' => $data['name'],
            'shortcut' => $shortcut,
            'shared' => $data['shared'],
            'user_id' => $userId,
            'group_id' => $data['groupId'] ?? null,
        ]);
        $cannedReply->syncInlineImages();

        if ($attachments = request('attachments')) {
            $cannedReply->attachments()->sync($attachments);
        }

        if ($tagNames = request('tags')) {
            $tags = app(Tag::class)->insertOrRetrieve($tagNames);
            $cannedReply->tags()->sync($tags->pluck('id'));
        }

        return $this->success(['cannedReply' => $cannedReply], 201);
    }

    public function update(int $id)
    {
        $cannedReply = CannedReply::findOrFail($id);

        $this->authorize('update', $cannedReply);

        $userId = Auth::id();

        $data = $this->validate(request(), [
            'body' => 'required|string|min:3',
            'shared' => 'boolean',
            'name' => "required|string|min:3|max:255|unique:canned_replies,name,$id,id,user_id,$userId",
            'shortcut' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^#?[A-Za-z0-9_-]+$/',
                Rule::unique('canned_replies', 'shortcut')->ignore($id),
            ],
            'attachments' => 'array|max:5|exists:file_entries,id',
            'groupId' => 'int|exists:groups,id',
            'tags' => 'array|max:10',
            'tags.*' => 'string',
        ]);

        $shortcut = isset($data['shortcut']) && is_string($data['shortcut'])
            ? trim($data['shortcut'])
            : null;
        if ($shortcut === '') {
            $shortcut = null;
        }
        if ($shortcut && !str_starts_with($shortcut, '#')) {
            $shortcut = "#{$shortcut}";
        }

        $cannedReply
            ->fill([
                'body' => $data['body'],
                'name' => $data['name'],
                'shortcut' => $shortcut,
                'shared' => $data['shared'],
                'group_id' => $data['groupId'] ?? null,
            ])
            ->save();

        $cannedReply->syncInlineImages();

        if ($attachments = request('attachments')) {
            $cannedReply->attachments()->sync($attachments);
        }

        if ($tagNames = request('tags')) {
            $tags = app(Tag::class)->insertOrRetrieve($tagNames);
            $cannedReply->tags()->sync($tags->pluck('id'));
        }

        return $this->success(['cannedReply' => $cannedReply]);
    }

    public function destroy(string $ids)
    {
        $replyIds = explode(',', $ids);

        $this->blockOnDemoSite();
        $this->authorize('destroy', CannedReply::class);

        // detach attachments and inlines images from canned replies
        DB::table('file_entry_models')
            ->where('model_type', CannedReply::MODEL_TYPE)
            ->whereIn('model_id', $replyIds)
            ->delete();

        CannedReply::whereIn('id', $replyIds)->delete();

        return $this->success();
    }
}
