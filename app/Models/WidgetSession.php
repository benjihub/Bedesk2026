<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WidgetSession extends Model
{
    protected $table = 'widget_sessions';

    protected $fillable = [
        'visitor_id',
        'last_conversation_id',
    ];
}
