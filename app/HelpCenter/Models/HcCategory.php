<?php namespace App\HelpCenter\Models;

use App\HelpCenter\Traits\FiltersByVisibleToRole;
use Common\Core\BaseModel;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\Traits\HasAttachedFileEntries;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Laravel\Scout\Searchable;

class HcCategory extends BaseModel
{
    use FiltersByVisibleToRole, Searchable, HasAttachedFileEntries;

    const MODEL_TYPE = 'category';

    protected $table = 'categories';
    protected $hidden = ['pivot'];
    protected $guarded = ['id'];
    protected $appends = ['model_type', 'is_section'];
    protected $casts = [
        'id' => 'integer',
        'parent_id' => 'integer',
        'position' => 'integer',
        'hidden' => 'boolean',
        'hide_from_structure' => 'boolean',
    ];

    protected function getIsSectionAttribute(): bool
    {
        return $this->parent_id !== null;
    }

    public function sections()
    {
        return $this->hasMany(
            HcCategory::class,
            'parent_id',
        )->orderByPosition();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(HcCategory::class, 'parent_id')->compact();
    }

    public function articles(): BelongsToMany
    {
        $query = $this->belongsToMany(
            HcArticle::class,
            'category_article',
            'category_id',
            'article_id',
        )->compact();

        [$col, $dir] = explode(
            '|',
            settings('articles.default_order', 'position|desc'),
        );

        if ($col === 'position') {
            $query->orderByPosition();
        } elseif ($col === 'was_helpful') {
            $query->orderByFeedback($dir);
        } else {
            $query->orderBy($col, $dir);
        }

        return $query;
    }

    public function images()
    {
        return $this->attachedFileEntriesRelation('images');
    }

    public function syncImage()
    {
        if (is_string($this->image)) {
            (new SyncFileEntryModels())->fromUrl($this->image, $this->images());
        }
    }

    public function scopeOrderByPosition(Builder $q): Builder
    {
        $prefix = DB::getTablePrefix();
        return $q->orderBy(
            DB::raw(
                "{$prefix}categories.position = 0, {$prefix}categories.position",
            ),
        );
    }

    public function scopeRootOnly(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeCompact(Builder $query): Builder
    {
        return $query->select([
            'id',
            'name',
            'parent_id',
            'hide_from_structure',
        ]);
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'created_at' => $this->created_at->timestamp ?? '_null',
            'updated_at' => $this->updated_at->timestamp ?? '_null',
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'model_type' => self::MODEL_TYPE,
        ];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }
}
