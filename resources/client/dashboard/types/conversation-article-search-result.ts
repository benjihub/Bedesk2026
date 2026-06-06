import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
import {SimplePaginationResponse} from '@common/http/backend-response/pagination-response';

interface ConversationArticleSearchResult {
  id: number;
  title: string;
  path: ArticlePathItem[];
}

export interface ConversationArticleSearchResponse {
  pagination: SimplePaginationResponse<ConversationArticleSearchResult>;
}
