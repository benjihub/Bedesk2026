{{__('Thanks for getting in touch! This is an automatic email just to let you know that we’ve received your request and your ticket reference is #:ticketId.', ['ticketId' => $conversation->id])}}

{{__('One of our support agents will get back to you shortly. Please do not submit multiple tickets for the same request, as this will not result in a faster response time.')}}

{{__('If you’d like to email an update before you hear back from us, please reply to this email. In the meantime, feel free to check out our :helpCenter resources for more help.', ['helpCenter' => url('/hc')])}}

{{__('Kind regards')}},
{{__(':site support team', ['site' => config('app.name')])}}

{{$reference}}
