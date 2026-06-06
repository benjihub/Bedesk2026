@extends('common::prerender.base')

@section('head')
    @include('seo.hc-search-page.seo-tags')
@endsection

@section('body')
    <h1>Search results for {{$query}}</h1>

    <div class="articles">
        @foreach($pagination as $article)
            <div class="article">
                <h2><a class="title" href="{{urls()->article($article)}}">{{$article['title']}}</a></h2>

                @if($article['path'])
                    @foreach($article['path'] as $item)
                        <a class="parent" href="{{urls()->category($item)}}">
                            {{$item['name']}}
                        </a>
                        /
                    @endforeach
                @endif
            </div>
        @endforeach
    </div>
@endsection
