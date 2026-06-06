import {BackendResponse} from '@common/http/backend-response/backend-response';

export interface UpdateArticlePageData extends BackendResponse {
  article: {
    id: number;
    title: string;
    slug: string;
    visible_to_role: number | undefined;
    author_id: number;
    managed_by_role: number | undefined;
    sections: {
      id: number;
      name: string;
      parent_id: number;
    }[];
    tags: {id: number; name: string}[];
    attachments: {id: number; name: string}[];
    draft: boolean;
    body: string;
  };
  loader: 'updateArticle';
}
