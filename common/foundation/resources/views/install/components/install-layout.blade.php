<?php
$cssVariables = collect(config('themes.light'))
    ->mapWithKeys(fn($value, $key) => [$key => $value])
    ->map(fn($value, $key) => "$key: $value;")
    ->implode('');
$buttonClass =
    'py-8 px-16 bg-primary font-semibold text-on-primary rounded shadow active:bg-primary-dark focus:ring';
?>

<!DOCTYPE html>
<html style="{{$cssVariables}}">
<head>
    <title>Install</title>
    <link href="{{ getMainCssFileUrl() }}" rel="stylesheet">
</head>
<body class="bg-alt flex flex-col items-center justify-center text-main">
<img src="{{ file_exists(public_path('images/logo-dark.png')) ? asset('images/logo-dark.png') : asset('images/logo-dark.svg') }}" alt="Logo" class="h-40 mb-34" />
<div class="w-780 p-24 rounded-md bg shadow border">
    {{$slot}}
</div>
</body>
</html>

