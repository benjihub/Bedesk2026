@extends('common::prerender.base')

@section('head')
    @include('seo.hc-landing-page.seo-tags')
@endsection

@section('body')
    <h1>{{ __('Help Center') }}</h1>

    @foreach ($categories as $category)
        <section class="category">
            <div class="category-info">
                <h2 class="category-name">
                    <a class="text" href="{{ urls()->category($category) }}">
                        {{ $category['name'] }}
                    </a>
                </h2>

                @if ($category['description'])
                    <p class="category-description">
                        {{ $category['description'] }}
                    </p>
                @endif
            </div>

            <div class="child-categories">
                @foreach ($category['sections'] as $section)
                    <div class="child-category">
                        <div class="title">
                            <h3 class="child-category-name">
                                <a href="{{ urls()->category($section) }}">
                                    {{ $section['name'] }}
                                    ({{ $section['articles_count'] }})
                                </a>
                            </h3>
                        </div>

                        <ul class="articles-list">
                            @foreach ($section['articles'] as $article)
                                <li>
                                    <a
                                        class="article"
                                        href="{{ urls()->article($article) }}"
                                    >
                                    <span class="text">
                                        {{ $article['title'] }}
                                    </span>
                                    </a>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                @endforeach
            </div>
        </section>
    @endforeach
@endsection
