export interface Status {
  id: number;
  label: string;
  user_label: string | null;
  category: number;
  active: boolean;
  internal: boolean;
  updated_at: string;
}
