<?php

namespace Livechat\Models;

use Common\Core\BaseModel;
use Common\Files\Actions\SyncFileEntryModels;
use Common\Files\Traits\HasAttachedFileEntries;
use Laravel\Scout\Searchable;
use Livechat\Models\IdeHelperCampaign;

class Campaign extends BaseModel
{
    use Searchable, HasAttachedFileEntries;

    const MODEL_TYPE = 'campaign';

    protected $guarded = ['id'];

    protected $dateFormat = 'Y-m-d H:i:s';

    protected $casts = [
        'content' => 'array',
        'conditions' => 'array',
        'appearance' => 'array',
        'width' => 'float',
        'height' => 'float',
        'enabled' => 'bool',
        'impression_count' => 'int',
        'interaction_count' => 'int',
    ];

    public function contentEntries()
    {
        return $this->attachedFileEntriesRelation('content');
    }

    public function syncContentEntries()
    {
        (new SyncFileEntryModels())->fromArray(
            [
                'content' => $this->content,
                'appearance' => $this->appearance,
            ],
            $this->contentEntries(),
        );
    }

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    public static function filterableFields(): array
    {
        return ['enabled'];
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
