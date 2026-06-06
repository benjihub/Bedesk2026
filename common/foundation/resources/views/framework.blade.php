@php
    use Illuminate\Support\Js;
    use Sentry\Laravel\Integration;
@endphp

<!DOCTYPE html>
<html
    lang="{{ $bootstrapData->get('language') }}"
    style="{{ $bootstrapData->initialTheme->getCssVariables() }}"
    data-theme-id="{{ $bootstrapData->initialTheme['id'] }}"
    @class([
        'dark' => $bootstrapData->initialTheme['is_dark'],
        'is-settings-preview' => $bootstrapData->get('is_settings_preview')
    ])
>
    <head>
        <base href="{{ $htmlBaseUri }}" />

        @if (isset($seoTagsView))
            @include($seoTagsView, $pageData)
        @elseif (isset($meta))
            @include('common::prerender.meta-tags')
        @else
            <title>{{ settings('branding.site_name') }}</title>
        @endif

        <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
            data-keep="true"
        />
        <link
            rel="icon"
            type="image/x-icon"
            href="{{url('favicon/icon-144x144.png')}}"
            data-keep="true"
        />
        <link
            rel="apple-touch-icon"
            href="{{url('favicon/icon-192x192.png')}}"
            data-keep="true"
        />
        <link rel="manifest" href="{{url('manifest.json')}}" data-keep="true" />
        <meta
            name="theme-color"
            content="rgb({{ $bootstrapData->initialTheme->getHtmlThemeColor() }})"
            data-keep="true"
        />

        @if ($fontFamily = $bootstrapData->initialTheme->getFontFamily())
            @if($bootstrapData->initialTheme->isGoogleFont())
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family={{$fontFamily}}:wght@400;500;600;700&display=swap" rel="stylesheet">
            @endif
        @endif

        <script>
            window.bootstrapData = {!! json_encode($bootstrapData->get()) !!};
        </script>

        @if (isset($devCssPath))
            <link rel="stylesheet" href="{{ $devCssPath }}" />
        @endif

        @viteReactRefresh
        @vite('resources/client/main.tsx')

        @if (file_exists($customCssPath))
            @if ($content = file_get_contents($customCssPath))
                <style>
                    {!! $content !!}
                </style>
            @endif
        @endif

        @if (file_exists($customHtmlPath))
            @if ($content = file_get_contents($customHtmlPath))
                {!! $content !!}
            @endif
        @endif

        @if ($code = settings('analytics.tracking_code'))
            <!-- Google tag (gtag.js) -->
            <script
                async
                src="https://www.googletagmanager.com/gtag/js?id={{ settings('analytics.tracking_code') }}"
            ></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', "{{ settings('analytics.tracking_code') }}");
            </script>
        @endif

        @yield('head-end')
    </head>

    <body>
        <div id="root">
            <div class="flex h-screen w-screen items-center justify-center">
                <svg viewBox="0 0 32 32" fill="none" stroke-width="3" class="progress-circle indeterminate overflow-hidden w-40 h-40">
                    <circle cx="16" cy="16" r="13" role="presentation" stroke-dasharray="81.68140899333463 81.68140899333463" stroke-dashoffset="0" transform="rotate(-90 16 16)"  class="progress-circle-track"></circle>
                    <circle cx="16" cy="16" r="13" role="presentation" stroke-dasharray="81.68140899333463 81.68140899333463" stroke-dashoffset="61.26105674500097" transform="rotate(-90 16 16)"  class="progress-circle-fill"></circle>
                </svg>
            </div>
        </div>

        <noscript>
            You need to have javascript enabled in order to use
            <strong>{{ config('app.name') }}</strong>
            .
        </noscript>

        @yield('body-end')
    </body>
</html>
