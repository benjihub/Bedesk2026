<?php namespace App\Contacts\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDetails extends Model {

    const MODEL_TYPE = 'user_details';

    public static function getModelTypeAttribute(): string
    {
        return self::MODEL_TYPE;
    }

    protected $fillable = ['details', 'notes'];

    public $timestamps = false;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
