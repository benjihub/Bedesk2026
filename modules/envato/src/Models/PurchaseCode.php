<?php namespace Envato\Models;

use App\Models\User;
use Common\Core\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Scout\Searchable;

class PurchaseCode extends BaseModel
{
    use Searchable;

    const MODEL_TYPE = 'purchase_code';

    protected $guarded = ['id'];
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'item_id' => 'integer',
        'supported_until' => 'datetime',
        'purchased_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'item_name' => $this->item_name,
            'envato_username' => $this->envato_username,
        ];
    }

    public static function filterableFields(): array
    {
        return ['id', 'created_at', 'updated_at'];
    }

    public static function getModelTypeAttribute(): string
    {
        return static::MODEL_TYPE;
    }

    public function toNormalizedArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->item_name,
            'description' => $this->envato_username,
        ];
    }
}
