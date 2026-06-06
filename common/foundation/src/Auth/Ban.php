<?php

namespace Common\Auth;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * 
 *
 * @property int $id
 * @property string $bannable_type
 * @property int $bannable_id
 * @property string|null $created_by_type
 * @property int|null $created_by_id
 * @property string|null $comment
 * @property \Illuminate\Support\Carbon|null $expired_at
 * @property string|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Model|\Eloquent $bannable
 * @property-read Model|\Eloquent|null $createdBy
 * @property-read string $model_type
 * @method static \Illuminate\Database\Eloquent\Builder|Ban newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Ban newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Ban query()
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereBannableId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereBannableType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereComment($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereCreatedById($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereCreatedByType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereExpiredAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Ban whereUpdatedAt($value)
 * @mixin \Eloquent
 */
class Ban extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'expired_at' => 'datetime',
    ];

    const MODEL_TYPE = 'ban';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    protected static function booted(): void
    {
        static::created(function (Ban $ban) {});
    }

    public function createdBy(): MorphTo
    {
        return $this->morphTo('created_by');
    }

    public function bannable(): MorphTo
    {
        return $this->morphTo();
    }
}
