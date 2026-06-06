export const ARTICLE_MODEL = 'article';

export interface ArticlePathItem {
  id: number;
  name: string;
  is_section?: boolean;
  parent_id?: number | null;
  hide_from_structure?: boolean;
}
