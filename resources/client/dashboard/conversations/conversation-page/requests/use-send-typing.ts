import {apiClient} from '@common/http/query-client';
import {useDebouncedCallback} from 'use-debounce';

export function useSendTyping(conversationId?: number | string) {
  const send = useDebouncedCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      apiClient
        .post(`helpdesk/agent/conversations/${conversationId}/typing`, {
          is_typing: isTyping,
        })
        .catch(() => {
          // typing updates are best-effort
        });
    },
    250,
    {maxWait: 1500},
  );

  const startTyping = () => send(true);
  const stopTyping = () => send(false);

  return {startTyping, stopTyping};
}
