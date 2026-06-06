import {BackendResponse} from '@common/http/backend-response/backend-response';

type Article = {
  id: number;
  title: string;
  description?: string;
};

export interface LandingPageDataCategory {
  id: number;
  name: string;
  image: string | undefined;
  description: string | undefined;
  parent_id: number | null;
  articles_count: number;
  hide_from_structure: boolean;
  articles: Article[];
  sections: LandingPageDataCategory[];
}

export interface HcLandingPageData extends BackendResponse {
  categories: LandingPageDataCategory[];
  articles?: {id: number; title: string; body: string}[];
}
