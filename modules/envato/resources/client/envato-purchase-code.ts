export interface EnvatoPurchaseCode {
  id: number;
  code: string;
  item_name: string;
  item_id: number;
  url?: string;
  image?: string;
  supported_until?: string;
  purchased_at?: string;
  support_expired?: boolean;
  updated_at?: string;
  envato_username?: string;
  domain?: string;
}
