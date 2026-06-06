@if ($includeHistory)
    @foreach($conversation->latestMessages as $message)
        ## {{$message->user->name}} replied, on {{$message->created_at->format('Y-m-d H:i')}}:

        {{ strip_tags($message->body) }}

        -----------------------------------------------------------

    @endforeach
@else
    {{ strip_tags($conversation->latestMessages->first()->body) }}
@endif

{{$reference}}
