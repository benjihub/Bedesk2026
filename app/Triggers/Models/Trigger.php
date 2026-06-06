<?php namespace App\Triggers\Models;

use App\Triggers\TriggersConfig;
use Common\Core\BaseModel;
use Illuminate\Support\Collection;

class Trigger extends BaseModel
{
    const MODEL_TYPE = 'trigger';

    protected $guarded = ['id'];
    protected $appends = ['model_type'];

    protected $casts = [
        'id' => 'integer',
        'times_fired' => 'integer',
        'user_id' => 'integer',
        'config' => 'array',
    ];

    public function conditions(): Collection
    {
        return collect($this->config['conditions']);
    }

    public function actions(): Collection
    {
        return collect($this->config['actions']);
    }

    public static function getAllWhereTimeBased(bool $condition)
    {
        $config = (new TriggersConfig())->get();
        return self::all()->filter(
            fn(Trigger $trigger) => $trigger
                ->conditions()
                ->map(fn($c) => $config['conditions'][$c['name']] ?? null)
                ->filter()
                ->some('time_based', '=', $condition),
        );
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

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'model_type' => self::MODEL_TYPE,
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
}
