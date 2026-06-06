export interface HcCategoryManagerItem {
  id: number;
  name: string;
  is_section: boolean;
  parent_id: number | undefined;
  description: string | undefined;
  image: string | undefined;
  visible_to_role: number | undefined;
  managed_by_role: number | undefined;
  hide_from_structure: boolean;
  articles_count: number;
  sections_count: number;
}

export interface HcManagerCategoriesResponse {
  categories: HcCategoryManagerItem[];
  category?: {
    id: number;
    name: string;
  };
}

export interface HcManagerArticle {
  id: number;
  title: string;
  position: number;
}

export interface HcManagerArticlesResponse {
  articles: HcManagerArticle[];
  section: {id: number; name: string};
  category: {id: number; name: string};
}
