<?php

if (version_compare(PHP_VERSION, '8.2') === -1) {
    exit('You need at least PHP 8.2 to install this application.');
}

// create .htaccess files if they don't exist and refresh the page
$rootHtaccess = __DIR__ . '/.htaccess';
$rootHtaccessStub = __DIR__ . '/htaccess.example';
$publicHtaccess = __DIR__ . '/public/.htaccess';
$publicHtaccessStub = __DIR__ . '/public/htaccess.example';
if (!file_exists($rootHtaccess) || !file_exists($publicHtaccess)) {
    try {
        if (!file_exists($rootHtaccess)) {
            file_put_contents(
                $rootHtaccess,
                file_get_contents($rootHtaccessStub),
            );
        }

        if (!file_exists($publicHtaccess)) {
            file_put_contents(
                $publicHtaccess,
                file_get_contents($publicHtaccessStub),
            );
        }
        header('Refresh: 0');
        exit();
    } catch (Exception $e) {
        //
    }
}
?>

<html lang="en">
<head>
    <title>.htaccess error</title>
    <style>
        html {
            width: 100%;
            height: 100%;
        }
        body {
            background: rgb(250, 250, 250);
            color: rgba(0, 0, 0, 0.87);
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
        }
        .logo {
            text-align: center;
            margin-bottom: 25px;
        }
        img {
            max-width: 200px;
        }
        .panel {
            background: rgb(255, 255, 255);
            border: 1px solid rgba(0, 0, 0, 0.12);
            padding: 40px 80px;
            border-radius: 4px;
            width: max-content;
            text-align: center;
            max-width: 700px;
        }
        h1 {
            margin: 0 0 6px;
        }
        p {
            font-size: 20px;
        }
    </style>
</head>
<body>
<div class="panel">
    <h1>Could not find .htaccess file</h1>
    <p>See the installation documentation for possible solutions or check your server configuration.</p>
</div>
</body>
</html>
