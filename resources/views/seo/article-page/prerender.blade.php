@extends('common::prerender.base')

@section('head')
    @include('seo.article-page.seo-tags')
@endsection

@section('body')
    <h1 class="title">{{ $article['title'] }}</h1>

    {!! $article['body'] !!}

    <div class="tags">
        @foreach ($article['tags'] ?? [] as $tag)
            <span>{{ $tag['name'] }}</span>
        @endforeach
    </div>
@endsection
