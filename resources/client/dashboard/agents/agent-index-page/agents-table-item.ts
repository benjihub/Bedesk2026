export interface AgentsTableItem {
  id: number;
  name: string;
  email: string;
  role: string;
  banned_at: string | null;
  last_active_at: string | null;
  accepts_conversations: boolean;
}
