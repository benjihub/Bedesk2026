export interface GroupPromotion {
  id: number;
  group_id: number;
  title: string;
  description?: string | null;
  discount?: number | null;
  code?: string | null;
  terms?: string | null;
  how_to_claim?: string | null;
  active?: boolean;
  created_at?: string;
}
