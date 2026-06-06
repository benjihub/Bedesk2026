export interface CustomersDatatableItem {
  id: number;
  name?: string;
  image?: string | null;
  email?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  banned_at?: string;
  last_active_at?: string;
  page_visits_count?: number;
  conversations_count?: number;
}
