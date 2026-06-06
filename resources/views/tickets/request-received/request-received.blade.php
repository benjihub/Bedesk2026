@extends('tickets.layout.ticket-with-reference')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0" border="0" id="{{\App\Conversations\Messages\MessageBodyPurifier::REPLY_ABOVE_ID}}">
    <tr>
        <td>
            <p>{{__('Thanks for getting in touch! This is an automatic email just to let you know that we’ve received your request and your ticket reference is #:ticketId.', ['ticketId' => $conversation->id])}}</p>
            <p>{{__('One of our support agents will get back to you shortly. Please do not submit multiple tickets for the same request, as this will not result in a faster response time.')}}</p>
            <p>{!!__('If you’d like to email an update before you hear back from us, please reply to this email. In the meantime, feel free to check out our :helpCenter resources for more help.', ['helpCenter' => '<a href="' . url('/hc') . '">Help Center</a>'])!!}</p>
            <p>{{__('Kind regards')}},</p>
            <p>{{__(':site support team', ['site' => config('app.name')])}}</p>
        </td>
    </tr>
</table>
@endsection
