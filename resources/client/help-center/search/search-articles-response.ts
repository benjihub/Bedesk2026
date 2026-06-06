import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {SimplePaginationResponse} from '@common/http/backend-response/pagination-response';

export interface SearchArticlesResponse {
  pagination: SimplePaginationResponse<{
    id: number;
    title: string;
    slug: string;
    updated_at: string;
    path: ArticlePathItem[];
  }>;
  query: string;
  categoryIds?: number[];
}
