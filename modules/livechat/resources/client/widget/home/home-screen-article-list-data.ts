import {ArticlePathItem} from '@app/help-center/articles/article-path-item';

export interface HomeScreenArticleListData {
  articles: {
    id: number;
    title: string;
    slug: string;
    path: ArticlePathItem[];
  }[];
}
