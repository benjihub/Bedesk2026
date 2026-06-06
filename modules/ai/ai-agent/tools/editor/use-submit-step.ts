import {
  aiAgentQueries,
  getAiAgentGroupIdFromUrl,
} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentTool} from '@ai/ai-agent/tools/ai-agent-tool';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {useToolEditorStore} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {BackendErrorResponse} from '@common/errors/backend-error-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {partialMatchKey, useMutation} from '@tanstack/react-query';
import axios from 'axios';
import {useParams} from 'react-router';

export function useSubmitStep(step: ToolEditorStep) {
  const {toolId} = useParams();
  const getValues = useToolEditorStore(s => s.getValues);
  const syncWithTool = useToolEditorStore(s => s.syncWithTool);
  const setErrors = useToolEditorStore(s => s.setErrors);

  return useMutation({
    onMutate: () => {
      setErrors(step, {});
    },
    mutationFn: () => {
      const payload = {
        ...getValues(step),
        step,
        ...(getAiAgentGroupIdFromUrl()
          ? {groupId: getAiAgentGroupIdFromUrl()}
          : {}),
      };

      return (
        toolId
          ? apiClient.put<{tool: AiAgentTool}>(
              `lc/ai-agent/tools/${toolId}`,
              payload,
            )
          : apiClient.post<{tool: AiAgentTool}>(`lc/ai-agent/tools`, payload)
      ).then(r => r.data);
    },
    onSuccess: async response => {
      const toolKey = aiAgentQueries.tools.get(
        response.tool.id,
        'editor',
      ).queryKey;
      queryClient.setQueryData(toolKey, {tool: response.tool});
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.tools.invalidateKey,
        predicate: query => !partialMatchKey(query.queryKey, toolKey),
      });
      syncWithTool(step, response.tool);
    },
    onError: r => {
      if (axios.isAxiosError(r) && r.response) {
        const backendErrors =
          (r.response.data as BackendErrorResponse).errors || {};
        if (!backendErrors || Object.keys(backendErrors).length === 0) {
          showHttpErrorToast(r);
        } else {
          const errors: Record<string, string> = {};
          for (const [key, value] of Object.entries(backendErrors)) {
            errors[key] = Array.isArray(value) ? value[0] : value;
          }
          setErrors(step, errors);
        }
      }
    },
  });
}
