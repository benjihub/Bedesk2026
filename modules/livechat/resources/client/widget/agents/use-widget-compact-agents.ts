import {CompactAgent} from '@app/dashboard/types/agent';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';

interface CompactAgentWithOnlineStatus extends CompactAgent {
  isOnline: boolean;
}

export function useCompactAgents(): {
  agents: CompactAgentWithOnlineStatus[];
  isLoading: boolean;
} {
  const {data, isLoading} = useQuery(widgetQueries.agents.compact());

  const agents = useMemo(() => {
    return (data?.agents ?? []).map(agent => {
      // Widget can't reliably join the internal helpdesk presence channel.
      // Treat "online" as "active recently" for widget availability.
      return {
        ...agent,
        isOnline: !!agent.wasActiveRecently,
      };
    });
  }, [data]);

  return {agents, isLoading};
}

export function useAgentWasActiveRecently(agentId: number | string): boolean {
  const {agents} = useCompactAgents();
  return agents.some(a => a.id === +agentId && a.wasActiveRecently);
}

export function useAgentsAcceptingConversations(): {
  agents: CompactAgentWithOnlineStatus[];
  isLoading: boolean;
} {
  const {agents, isLoading} = useCompactAgents();
  return {
    isLoading,
    agents: agents.filter(
      agent => agent.acceptsConversations && agent.wasActiveRecently,
    ),
  };
}
