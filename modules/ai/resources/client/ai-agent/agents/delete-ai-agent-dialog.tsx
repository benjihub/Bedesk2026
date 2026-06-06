import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {AiAgent} from './use-ai-agents';

interface Props {
  agent: AiAgent;
}

export function DeleteAiAgentDialog({agent}: Props) {
  const {close} = useDialogContext();

  const deleteAgent = useMutation({
    mutationFn: () => apiClient.delete(`lc/ai-agent/agents/${agent.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['lc', 'ai-agent', 'agents']});
      toast(message('Agent deleted'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteAgent.isPending}
      title={<Trans message="Delete AI agent" />}
      body={<Trans message="Are you sure you want to delete this agent?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteAgent.mutate()}
    />
  );
}
