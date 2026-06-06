<!DOCTYPE html>
<html
    style="{{ $bootstrapData->initialTheme->getCssVariables() }}"
    data-theme-id="{{ $bootstrapData->initialTheme['id'] }}"
    @class(['dark' => $bootstrapData->initialTheme['is_dark']])
>
<head>
    @viteReactRefresh
    @vite('modules/livechat/resources/client/widget/widget-entry.tsx')
    <base href="{{ $htmlBaseUri }}"/>

    <title>Chat widget</title>

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
        data-keep="true"
    />

    <meta
        name="theme-color"
        content="rgb({{ $bootstrapData->initialTheme->getHtmlThemeColor() }})"
        data-keep="true"
    />

    @if ($fontFamily = $bootstrapData->initialTheme->getFontFamily())
        @if($bootstrapData->initialTheme->isGoogleFont())
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link
                href="https://fonts.googleapis.com/css2?family={{$fontFamily}}:wght@400;500;600;700&display=swap"
                rel="stylesheet">
        @endif
    @endif

    <script>
        window.bootstrapData = {!! json_encode($bootstrapData->data) !!};
    </script>
</head>
<body>
<div id="root"></div>
</body>
</html>


