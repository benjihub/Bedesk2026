import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@common/http/query-client';
import { UseFormReturn } from 'react-hook-form';
import { showHttpErrorToast } from '@common/http/show-http-error-toast';
import { toast } from '@ui/toast/toast';
import {message} from '@ui/i18n/message';

interface CreateAiAgentPayload {
  name: string;
  enabled: boolean;
  personality: string;
  greeting_type: string;
  basic_greeting_message: string;
}

export function useCreateAiAgent(form: UseFormReturn<CreateAiAgentPayload>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAiAgentPayload) => {
      console.debug('Creating AI agent', payload);
      return apiClient.post('lc/ai-agent/agents', payload);
    },
    onSuccess: () => {
      toast(message('Agent created'));
      // invalidate both the simple ai-agents key and the datatable endpoint key
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['lc', 'ai-agent', 'agents'] });
      form.reset();
    },
    onError: (err) => {
      console.error('Failed creating AI agent', err);
      showHttpErrorToast(err);
    },
  });
}