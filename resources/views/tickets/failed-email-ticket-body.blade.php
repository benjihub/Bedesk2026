<p>This is an automatically generated Delivery Status Notification. Delivery to the following recipients failed: <strong>{{$recipient}}</strong></p>

<p>Failed delivery reason: <strong>{{$reason}}</strong></p>

@if($description)
    <p>{{$description}}</p>
@endif
@if($headers)
    <pre>{{$headers}}</pre>
@endif
