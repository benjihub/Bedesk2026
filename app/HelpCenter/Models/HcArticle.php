<?php namespace App\HelpCenter\Models;

use Ai\AiAgent\Models\AiAgentChunk;
use App\Core\UrlGenerator;
use App\HelpCenter\Actions\AddIdToAllHtmlHeadings;
use App\HelpCenter\ArticleCollection;
use App\HelpCenter\Traits\FiltersByVisibleToRole;
use App\Models\User;
use Common\Core\BaseModel;
use Common\Files\FileEntry;
use Common\Files\Traits\HasAttachedFileEntries;
use Common\Tags\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Support\Facades\DB;
use Laravel\Scout\Searchable;

class HcArticle extends BaseModel
{
    use Searchable, FiltersByVisibleToRole, HasAttachedFileEntries;

    const MODEL_TYPE = 'article';

    protected $table = 'articles';
    protected $guarded = [];
    protected $hidden = ['pivot', 'laravel_through_key'];
    protected $appends = ['model_type'];

    protected $casts = [
        'id' => 'integer',
        'was_helpful' => 'integer',
        'author_id' => 'integer',
        'draft' => 'boolean',
        'scan_pending' => 'boolean',
        'scan_started_at' => 'datetime',
        'managed_by_role' => 'integer',
        'visible_to_role' => 'integer',
        'used_by_ai_agent' => 'boolean',
    ];

    protected function body(): Attribute
    {
        return Attribute::make(
            set: fn($value) => $value
                ? (new AddIdToAllHtmlHeadings())->execute($value)
                : $value,
        );
    }

    protected function visibleToRole(): Attribute
    {
        return Attribute::make(set: fn($value) => $value ? $value : null);
    }

    protected function managedByRole(): Attribute
    {
        return Attribute::make(set: fn($value) => $value ? $value : null);
    }

    public function scopeCompact(Builder $query): Builder
    {
        return $query->select([
            'id',
            'title',
            'slug',
            'draft',
            'author_id',
            'updated_at',
        ]);
    }

    public function author(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'author_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            HcCategory::class,
            'category_article',
            'article_id',
            'category_id',
        )
            ->compact()
            ->orderBy('parent_id', 'desc');
    }

    public function sections(): BelongsToMany
    {
        return $this->categories()->whereNotNull('parent_id');
    }

    public function parent(): HasOne
    {
        return $this->hasOne(HcCategory::class, 'id', 'parent_id')->compact();
    }

    public function path(): BelongsToMany
    {
        return $this->categories()->compact()->reorder('parent_id', 'asc');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable', null, null, 'tag_id');
    }

    public function attachments(): BelongsToMany
    {
        return $this->attachedFileEntriesRelation('attachments')->select([
            'file_entries.id',
            'name',
            'file_size',
            'mime',
        ]);
    }

    public function inlineImages()
    {
        return $this->attachedFileEntriesRelation('images');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(HcArticleFeedback::class, 'article_id');
    }

    public function chunks()
    {
        return $this->morphMany(AiAgentChunk::class, 'chunkable');
    }

    public static function hashContent(string $content): string
    {
        return hash('xxh3', $content);
    }

    public function scopeOrderByPosition(Builder $q): Builder
    {
        $prefix = DB::getTablePrefix();
        return $q->orderBy(
            DB::raw(
                "{$prefix}category_article.position = 0, {$prefix}category_article.position",
            ),
        );
    }

    /**
     * Order articles by the amount of 'was helpful' user
     * feedback they have in hc_article_feedback table.
     */
    public function scopeOrderByFeedback(
        Builder $query,
        string $direction = 'desc',
    ): Builder {
        $prefix = DB::getTablePrefix();
        $subQuery = "(SELECT count(*) FROM {$prefix}article_feedback WHERE was_helpful = 1 AND article_id = {$prefix}articles.id) as was_helpful";

        return $query
            ->select('*', DB::raw($subQuery))
            ->orderBy('was_helpful', $direction);
    }

    public function newCollection(array $models = []): Collection
    {
        return new ArticleCollection($models);
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => strip_tags($this->body),
            'tags' => $this->tags->map(fn(Tag $tag) => $tag->name),
            'draft' => $this->draft,
            'description' => $this->description,
            'categories' => $this->categories->map->id,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    protected function makeAllSearchableUsing($query)
    {
        return $query->with(['categories', 'tags']);
    }

    public function makeSearchableUsing(Collection $models)
    {
        return $models->load(['categories', 'tags']);
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at', 'categories', 'draft'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'description' => $this->description,
            'image' => null,
            'model_type' => self::MODEL_TYPE,
        ];
    }

    public function toChunkableArray(): array|null
    {
        if ($this->title) {
            return [
                'id' => $this->id,
                'title' => $this->title,
                'url' => (new UrlGenerator())->article($this),
            ];
        }

        return null;
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
