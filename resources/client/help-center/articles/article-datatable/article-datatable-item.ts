import {ArticlePathItem} from '@app/help-center/articles/article-path-item';

export interface ArticleDatatableItem {
  id: number;
  title: string;
  slug: string;
  draft: boolean;
  author: {
    id: number;
    name: string;
    image: string | null;
    email: string | null;
  };
  updated_at: string;
  used_by_ai_agent: boolean;
  path: ArticlePathItem[];
}
