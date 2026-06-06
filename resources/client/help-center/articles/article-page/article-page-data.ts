import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {BackendResponse} from '@common/http/backend-response/backend-response';

export interface ArticlePageNavItem {
  indent: boolean;
  display_name: string;
  slug: string;
  type: string;
}

export interface ArticlePageData extends BackendResponse {
  article: {
    id: number;
    path: ArticlePathItem[];
    title: string;
    body: string;
    managed_by_role: number | null;
    attachments: {
      id: number;
      name: string;
      file_size: number;
      hash: string;
    }[];
  };
  pageNav: ArticlePageNavItem[];
  categoryNav: {
    id: number;
    name: string;
    parent_id: number | null;
    articles: {
      id: number;
      title: string;
      slug: string;
    }[];
  }[];
  loader: 'articlePage';
}
