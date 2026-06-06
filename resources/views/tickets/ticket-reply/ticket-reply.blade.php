@extends('tickets.layout.ticket-with-reference')

@section('content')
@if($includeHistory)
    @foreach($conversation->latestMessages as $index => $latestMessage)
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   id="{{\App\Conversations\Messages\MessageBodyPurifier::REPLY_ABOVE_ID}}">
                <tr>
                    <td width="100%"
                        style="padding: 15px 0; border-bottom: 1px dotted #c5c5c5;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style=" table-layout:fixed;">
                            <tr>
                                @if ($latestMessage->user->image)
                                    <td valign="top"
                                        style="padding: 0 15px 0 15px;width: 40px;">
                                        <img alt="user avatar" height="40" width="40"
                                            src="{{url($latestMessage->user->image)}}"
                                            style="height: auto; line-height: 100%; outline: none; text-decoration: none; border-radius: 5px;"/>
                                    </td>
                                @endif
                                <td width="100%" style="padding: 0; margin: 0;"
                                    valign="top">
                                    <p style="font-family: 'Lucida Grande','Lucida Sans Unicode','Lucida Sans',Verdana,Tahoma,sans-serif; font-size: 15px; line-height: 18px; margin-bottom: 0; margin-top: 0; padding: 0; color:#1b1d1e;">
                                        {{$latestMessage->user->name}}
                                    </p>
                                    <p style="font-family: 'Lucida Grande','Lucida Sans Unicode','Lucida Sans',Verdana,Tahoma,sans-serif; font-size: 13px; line-height: 25px; margin-bottom: 15px; margin-top: 0; padding: 0; color:#bbbbbb;">
                                        {{$latestMessage->created_at->format('Y-m-d H:i')}}
                                    </p>
                                    <div
                                        style="color: #2b2e2f; font-family: 'Lucida Sans Unicode', 'Lucida Grande', 'Tahoma', Verdana, sans-serif; font-size: 14px; line-height: 22px; margin: 15px 0">
                                        {!!$latestMessage->bodyForEmail()!!}
                                    </div>
                                    <p></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
    @endforeach
@else
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           id="{{\App\Conversations\Messages\MessageBodyPurifier::REPLY_ABOVE_ID}}">
        <tr>
            <td>
                {!!$conversation->latestMessages->first()->bodyForEmail()!!}
            </td>
        </tr>
    </table>
@endif
@endsection
