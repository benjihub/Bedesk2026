<?php namespace App\CannedReplies\Models;

use App\Models\User;
use Common\Core\BaseModel;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\FileEntry;
use Common\Files\Traits\HasAttachedFileEntries;
use Common\Tags\Taggable;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Auth;

class CannedReply extends BaseModel
{
    use Taggable, HasAttachedFileEntries;

    const MODEL_TYPE = 'canned_reply';

    protected $guarded = ['id'];
    protected $appends = ['model_type'];
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'shared' => 'boolean',
        'group_id' => 'integer',
    ];

    public function attachments(): BelongsToMany
    {
        return $this->attachedFileEntriesRelation('attachments');
    }

    public function inlineImages()
    {
        return $this->attachedFileEntriesRelation('images');
    }

    public function syncInlineImages()
    {
        if (is_string($this->body)) {
            (new SyncFileEntryModels())->fromHtml(
                $this->body,
                $this->inlineImages(),
            );
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForCurrentUser(Builder $builder)
    {
        $builder->where('user_id', Auth::id())->orWhere(function ($query) {
            $query
                ->whereIn('group_id', function ($q) {
                    return $q
                        ->select('id')
                        ->from('group_user')
                        ->where('user_id', Auth::id());
                })
                ->where('shared', true);
        });
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'body' => $this->body,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at'];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
        ];
    }
}
