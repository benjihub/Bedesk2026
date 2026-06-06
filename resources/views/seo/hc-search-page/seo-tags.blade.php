<meta property="og:site_name" content="{{ settings('branding.site_name') }}" />
<meta property="twitter:card" content="summary" />
<title>Results for {{ $query }} - {{ settings('branding.site_name') }}</title>
<meta
    property="og:title"
    content="Results for {{ $query }} - {{ settings('branding.site_name') }}"
/>
<meta property="og:url" content="{{ urls()->search($query) }}" />
<link rel="canonical" href="{{ urls()->search($query) }}" />
<meta property="og:description" content="Search results for {{ $query }}" />
<meta property="description" content="Search results for {{ $query }}" />
<meta property="og:type" content="website" />
