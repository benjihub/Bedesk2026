export interface AiAgentDocument {
  id: number;
  scan_pending: boolean;
  scan_failed: boolean;
  created_at: string;
  updated_at: string;
  markdown?: string;
  file_entry: {
    id: number;
    name: string;
    mime?: string;
    type?: string;
  };
}
