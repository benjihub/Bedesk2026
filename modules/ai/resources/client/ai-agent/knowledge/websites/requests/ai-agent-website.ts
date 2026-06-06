export interface AiAgentWebsite {
  id: string;
  title: string;
  url: string;
  scan_pending: boolean;
  updated_at: string;
}

export interface AiAgentWebpage {
  id: string;
  title: string;
  url: string;
  markdown?: string;
  fully_scanned: boolean;
  scan_pending: boolean;
  updated_at: string;
  ai_agent_website_id: number;
}
