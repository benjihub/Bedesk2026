import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {useQuery} from '@tanstack/react-query';
import {useParams} from 'react-router';

export function useTool() {
  const {toolId} = useParams();
  const {data} = useQuery({
    ...aiAgentQueries.tools.get(toolId!, 'editor'),
    enabled: !!toolId,
  });

  return data?.tool ?? null;
}
