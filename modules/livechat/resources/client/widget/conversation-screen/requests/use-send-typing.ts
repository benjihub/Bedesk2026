import {apiClient} from '@common/http/query-client';
import {useDebouncedCallback} from 'use-debounce';

export function useSendTyping(conversationId?: number | string) {
  const send = useDebouncedCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      apiClient
        .post(`lc/widget/chats/${conversationId}/typing`, {
          is_typing: isTyping,
        })
        .catch(() => {
          // typing is a best-effort signal; ignore errors
        });
    },
    250,
    {maxWait: 1500},
  );

  const startTyping = () => send(true);
  const stopTyping = () => send(false);

  return {startTyping, stopTyping};
}
