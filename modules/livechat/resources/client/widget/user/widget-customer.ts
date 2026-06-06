export interface WidgetCustomer {
  id: number;
  name?: string;
  email?: string;
  image?: string;
  gender?: string;
  banned_at?: string;
  created_at?: string;

  // visits
  page_visits_count: number;
  is_returning: boolean;

  // from session
  browser?: string;
  device?: string;
  city?: string;
  country?: string;
  language?: string;
  platform?: string;
  timezone?: string;

  attributes?: Record<string, string | number>;
}
