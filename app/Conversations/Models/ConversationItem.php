<?php namespace App\Conversations\Models;

use App\Models\User;
use Common\Core\BaseModel;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\Traits\HasAttachedFileEntries;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;
use Symfony\Component\DomCrawler\Crawler;

class ConversationItem extends BaseModel
{
    use Searchable, HasAttachedFileEntries;

    const MODEL_TYPE = 'conversationItem';
    const NOTE_TYPE = 'note';

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'conversation_id' => 'integer',
        'data' => 'array',
    ];

    protected $guarded = [];
    protected $appends = ['model_type'];
    protected $hidden = ['email_id'];

    public static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $model->uuid = $model->uuid ?? (string) Str::uuid();
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

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

    protected function body(): Attribute
    {
        return Attribute::make(
            get: function (string|null $value) {
                if (
                    $value &&
                    ($this->type !== 'message' &&
                        $this->type !== static::NOTE_TYPE)
                ) {
                    return json_decode($value, true);
                }
                return $value;
            },
            set: function ($value) {
                if (is_array($value)) {
                    return json_encode($value);
                }
                return $value;
            },
        );
    }

    public function makeBodyCompact(int $length = 120): static
    {
        if ($this->body && is_string($this->body)) {
            $this->body = strip_tags($this->body);
            $this->body = preg_replace('/<br\W*?>/', ' ', $this->body);
            $this->body = Str::limit($this->body, $length);
        }

        return $this;
    }

    public function bodyForEmail(): array|string|null
    {
        if (!is_string($this->body) || empty($this->body)) {
            return $this->body;
        }

        $crawler = new Crawler($this->body);

        // Process img[src] and a[href] elements with relative URLs
        $crawler->filter('img[src], a[href]')->each(function (Crawler $node) {
            $element = $node->getNode(0);
            if (!$element instanceof \DOMElement) {
                return;
            }

            $attributeName = $element->tagName === 'img' ? 'src' : 'href';
            $attributeValue = $element->getAttribute($attributeName);

            if (!$attributeValue) {
                return;
            }

            $parsed = parse_url($attributeValue);
            if (!isset($parsed['host'])) {
                $element->setAttribute($attributeName, url($attributeValue));
            }
        });

        return $crawler->html();
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'body' => strip_tags($this->body),
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->type === 'message';
    }

    public static function filterableFields(): array
    {
        return ['id'];
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => strip_tags($this->body),
        ];
    }
}
