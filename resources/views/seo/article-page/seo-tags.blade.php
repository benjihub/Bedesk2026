<meta property="og:site_name" content="{{ settings('branding.site_name') }}" />
<meta property="twitter:card" content="summary" />
<title>{{ $article['title'] }} - {{ settings('branding.site_name') }}</title>
<meta
    property="og:title"
    content="{{ $article['title'] }} - {{ settings('branding.site_name') }}"
/>
<meta property="og:url" content="{{ urls()->article($article) }}" />
<link rel="canonical" href="{{ urls()->article($article) }}" />
<meta property="og:title" content="{{ $article['title'] }}" />
@if(isset($article['description']))
    <meta property="og:description" content="{{ $article['description'] }}" />
    <meta property="description" content="{{ $article['description'] }}" />
@endif
<meta property="og:type" content="article" />
@if(isset($article['created_at']))
    <meta property="article:published_time" content="{{ $article['created_at'] }}" />
@endif
@if(isset($article['updated_at']))
    <meta property="article:modified_time" content="{{ $article['updated_at'] }}" />
@endif
@if(isset($article['path'][0]))
    <meta property="article:section" content="{{ $article['path'][0]['name'] }}" />
@endif
