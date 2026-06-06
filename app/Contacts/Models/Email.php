<?php namespace App\Contacts\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Email extends Model
{
    const MODEL_TYPE = 'email';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    protected $fillable = ['address'];

    protected $hidden = ['user_id'];

    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
