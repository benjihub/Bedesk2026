import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@common/http/query-client';

export interface AiAgent {
  id: number;
  name: string;
  image?: string;
  enabled: boolean;
  personality: string;
  greeting_type: string;
  initial_flow_id?: number;
  basic_greeting_message?: string;
  basic_greeting_flow_ids?: number[];
  transfer_instruction?: string;
  cant_assist_instruction?: string;
  created_at: string;
  updated_at: string;
}

export function useAiAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => apiClient.get<{ agents: AiAgent[] }>('lc/ai-agent/agents').then(r => r.data),
  });
}