import {aiAgentPreviewMessages} from '@ai/ai-agent/preview/preview-messages';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {RestartAltIcon} from '@ui/icons/material/RestartAlt';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {useSettings} from '@ui/settings/use-settings';
import {Tooltip} from '@ui/tooltip/tooltip';
import {m} from 'framer-motion';
import {Fragment, ReactNode, useEffect, useRef, useState} from 'react';

interface Props {
  flowId?: number | string;
  resetConversationMessage?: (resetConversation: () => void) => ReactNode;
  onClose: () => void;
}
export function PreviewSidebar({
  flowId,
  resetConversationMessage,
  onClose,
}: Props) {
  const {base_url} = useSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resetConversation = useResetConversation();

  useEffect(() => {
    return aiAgentPreviewMessages.listen(window, {
      onPreviewLoaded: () => {
        setIsLoading(false);
      },
      onConversationIdChanged: conversationId => {
        setConversationId(conversationId);
      },
    });
  }, []);

  let src = `${base_url}/lc/widget/ai-agent-preview-mode`;
  if (flowId) {
    src += `?flowId=${flowId}`;
  }

  const handleResetConversation = () => {
    if (!iframeRef.current) return;

    // if no conversation ID, we will reload the iframe, so show the loading spinner
    if (!conversationId) {
      setIsLoading(true);
    }

    return resetConversation.mutateAsync({
      conversationId: conversationId,
      iframe: iframeRef.current,
    });
  };

  return (
    <Fragment>
      <div className="dashboard-rounded-panel dashboard-grid-sidenav-right relative flex w-[400px] flex-shrink-0 flex-col overflow-hidden max-xl:fixed max-xl:bottom-8 max-xl:right-8 max-xl:top-8 max-xl:max-h-[calc(100%-16px)] max-xl:shadow-lg xl:ml-8">
        <DatatablePageHeaderBar
          rightContent={
            <Fragment>
              <Tooltip label={<Trans message="Reset preview" />}>
                <IconButton onClick={() => handleResetConversation()}>
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
              <Tooltip label={<Trans message="Close preview" />}>
                <IconButton onClick={() => onClose()}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Fragment>
          }
        >
          <Trans message="Preview" />
        </DatatablePageHeaderBar>
        <div className="relative flex-auto">
          <iframe ref={iframeRef} src={src} className="h-full w-full" />
          {resetConversationMessage ? (
            <div className="absolute bottom-86 left-0 right-0 mx-20 bg">
              {resetConversationMessage(handleResetConversation)}
            </div>
          ) : null}
          {isLoading && (
            <div className="absolute inset-0 m-auto flex h-full w-full items-center justify-center bg">
              <ProgressCircle isIndeterminate />
            </div>
          )}
        </div>
      </div>
      <m.div
        key="preview-underlay"
        {...opacityAnimation}
        className="fixed inset-0 z-[1] bg-[rgba(34,48,74,.4)] xl:hidden"
        onClick={() => onClose()}
      />
    </Fragment>
  );
}

function useResetConversation() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      iframe,
    }: {
      conversationId?: string | null;
      iframe: HTMLIFrameElement;
    }) => {
      if (!conversationId) {
        return Promise.resolve(iframe.contentWindow?.location.reload());
      }
      return apiClient
        .delete(`lc/ai-agent-preview/conversations/${conversationId}`)
        .then(r => r.data);
    },
    onSuccess: (_, {iframe}) => {
      if (iframe.contentWindow) {
        aiAgentPreviewMessages.postConversationReset(iframe.contentWindow);
      }
    },
    onError: err => showHttpErrorToast(err),
  });
}
