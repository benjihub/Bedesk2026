export const SEARCH_TERM_MODEL = 'search_term';

export interface SearchTerm {
  id: number;
  term: string;
  user_id: number;
  count: number;
  term_count?: number;
  created_at?: string;
  updated_at?: string;
  model_type: typeof SEARCH_TERM_MODEL;
}
