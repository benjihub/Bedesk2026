@extends('common::prerender.base')

@section('head')
    @include('seo.category-page.seo-tags')
@endsection

@section('body')
    <h1 class="title">{{ $category['name'] }}</h1>

    {!! $category['description'] !!}

    <aside>
        <nav>
            @foreach ($categoryNav ?? [] as $category)
                <div class="child">
                    <h2>
                        <a href="{{ urls()->category($category) }}">
                            {{ $category['name'] }}
                        </a>
                    </h2>
                    <ul>
                        @foreach ($category['articles'] ?? [] as $article)
                            <li>
                                <a href="{{ urls()->article($article) }}">
                                    {{ $article['title'] }}
                                </a>
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endforeach
        </nav>
    </aside>

    @if (isset($articles))
        <div class="articles">
            @foreach ($articles as $article)
                <article>
                    <a href="{{ urls()->article($article) }}">
                        {{ $article['title'] }}
                    </a>
                </article>
            @endforeach
        </div>
    @endif
@endsection
