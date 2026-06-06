import {UpdateAgentPayload} from '@app/dashboard/agents/edit-agent-page/use-update-agent';
import {FullAgent} from '@app/dashboard/types/agent';
import {useForm} from 'react-hook-form';

export function useEditAgentForm(agent: FullAgent) {
  return useForm<UpdateAgentPayload>({
    defaultValues: {
      name: agent.name ?? '',
      image: agent.image ?? '',
      groups: agent.groups,
      roles: agent.roles,
      permissions: [],
    },
  });
}
