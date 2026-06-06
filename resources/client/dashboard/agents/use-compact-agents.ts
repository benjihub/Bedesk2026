import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CompactAgent} from '@app/dashboard/types/agent';
import {useEchoStore} from '@app/dashboard/websockets/echo-store';
import {useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';

interface CompactAgentWithOnlineStatus extends CompactAgent {
  isOnline: boolean;
}

export function useCompactAgents(): {
  agents: CompactAgentWithOnlineStatus[];
  isLoading: boolean;
} {
  const {data, isLoading} = useQuery(helpdeskQueries.agents.compact);
  const presence = useEchoStore(s => s.presence);

  const agents = useMemo(() => {
    const onlineAgentIds = (presence[helpdeskChannel.name] ?? [])
      .filter(user => user.isAgent)
      .map(agent => agent.modelId);
    return (data?.agents ?? []).map(agent => {
      const isOnline = onlineAgentIds.includes(agent.id);
      return {
        ...agent,
        wasActiveRecently: agent.wasActiveRecently || isOnline,
        isOnline: isOnline,
      };
    });
  }, [presence, data]);

  return {agents, isLoading};
}

export function useAgentWasActiveRecently(agentId: number | string): boolean {
  const {agents} = useCompactAgents();
  return agents.some(a => a.id === agentId && a.wasActiveRecently);
}

export function useAgentsAcceptingConversations() {
  const {agents} = useCompactAgents();
  return agents.filter(agent => {
    return agent.acceptsConversations && agent.wasActiveRecently;
  });
}
