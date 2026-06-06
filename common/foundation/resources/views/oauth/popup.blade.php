<h1 style="text-align: center">Logging in</h1>

<script>
    let status = "{!! $status !!}";
    let data   = null;

    @if(isset($data) && $data)
        @if(json_decode($data))
            data = {!! $data !!};
        @else
            data = '{!! $data !!}';
        @endif
    @endif

    const channel = new BroadcastChannel('social-auth');
    channel.postMessage({status: status, callbackData: data, type: 'social-auth'});
    setTimeout(() => {
        window.close();
    });
</script>
