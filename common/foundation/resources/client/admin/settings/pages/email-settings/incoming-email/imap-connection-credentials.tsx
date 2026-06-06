export interface ImapConnectionCredentials {
  id: string;
  name: string;
  host: string;
  port?: number;
  authentication?: 'basic' | 'oauth' | null;
  username: string;
  password: string;
  ssl?: boolean;
  folder?: string;
  lastUid?: number | null;
  createTickets?: boolean;
  createReplies?: boolean;
}
