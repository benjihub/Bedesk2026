import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {BackendResponse} from '@common/http/backend-response/backend-response';

export interface CategoryPageData extends BackendResponse {
  category: {
    id: number;
    name: string;
    image?: string;
    description: string;
    is_section: boolean;
    hide_from_structure: boolean;
    parent_id: number | undefined;
    parent:
      | {id: number; name: string; hide_from_structure: boolean}
      | undefined;
  };
  categoryNav: ArticlePageData['categoryNav'];
}
