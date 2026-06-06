<?php
$cssVariables = collect(config('themes.light'))
    ->mapWithKeys(fn($value, $key) => [$key => $value])
    ->map(fn($value, $key) => "$key: $value;")
    ->implode(''); ?>

        <!DOCTYPE html>
<html style="{{$cssVariables}}">
<head>
    <title>Custom domain connected</title>
    <link href="{{ getMainCssFileUrl() }}" rel="stylesheet">
</head>
<body class="bg-alt flex flex-col items-center justify-center text-main">
<img src="{{ file_exists(public_path('images/logo-dark.png')) ? asset('images/logo-dark.png') : asset('images/logo-dark.svg') }}"
     alt="Logo" class="h-40 mb-34"/>
<div class="w-680 max-w-full p-24 rounded-md bg shadow border text-center">
    {{$content}}
</div>
</body>
</html>

