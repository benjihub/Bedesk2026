<meta property="og:site_name" content="{{ settings('branding.site_name') }}" />
<meta property="twitter:card" content="summary" />
<title>{{ $category['name'] }} - {{ settings('branding.site_name') }}</title>
<meta
    property="og:title"
    content="{{ $category['name'] }} - {{ settings('branding.site_name') }}"
/>
<meta property="og:url" content="{{ urls()->category($category) }}" />
<link rel="canonical" href="{{ urls()->category($category) }}" />
<meta property="og:title" content="{{ $category['name'] }}" />
<meta property="og:description" content="{{ $category['description'] }}" />
<meta property="description" content="{{ $category['description'] }}" />
<meta property="og:type" content="website" />
