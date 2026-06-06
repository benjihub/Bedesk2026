interface Callbacks {
  onPreviewLoaded?: () => void;
  onConversationIdChanged?: (conversationId: string | null) => void;
  onConversationReset?: () => void;
}

export const aiAgentPreviewMessages = {
  listen: (window: Window, callbacks: Callbacks) => {
    const messageHandler = (e: MessageEvent) => {
      if (e.data.source !== 'ai-agent-preview') return;

      switch (e.data.type) {
        case 'previewLoaded':
          callbacks.onPreviewLoaded?.();
          break;
        case 'conversationIdChanged':
          callbacks.onConversationIdChanged?.(e.data.value);
          break;
        case 'conversationReset':
          callbacks.onConversationReset?.();
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  },
  postConversationIdChanged: (
    window: Window,
    conversationId: string | null,
  ) => {
    postMessage(window, 'conversationIdChanged', conversationId);
  },
  postConversationReset: (window: Window) => {
    postMessage(window, 'conversationReset', null);
  },
  postLoaded: (window: Window) => {
    postMessage(window, 'previewLoaded', null);
  },
};

function postMessage(window: Window, message: string, value: any) {
  window.postMessage(
    {
      source: 'ai-agent-preview',
      type: message,
      value,
    },
    '*',
  );
}
