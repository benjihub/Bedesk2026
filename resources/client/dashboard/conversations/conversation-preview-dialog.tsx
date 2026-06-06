import {FullConversationResponse} from '@app/dashboard/conversation';
import {ListView} from '@app/dashboard/conversations/conversation-page/messages/list/list-view';
import {useConversationMessages} from '@app/dashboard/conversations/conversation-page/requests/use-conversation-messages';
import {ConversationSubject} from '@app/dashboard/conversations/conversation-page/toolbar/conversation-subject';
import {getConversationPageLink} from '@app/dashboard/conversations/utils/get-conversation-page-link';
import {InboxSectionHeader} from '@app/dashboard/dashboard-layout/inbox-section-header';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {MergeIcon} from '@ui/icons/material/Merge';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {toast} from '@ui/toast/toast';
import {Link} from 'react-router';

interface Props {
  conversationId: number;
}
export function ConversationPreviewDialog({conversationId}: Props) {
  const conversationQuery = useQuery(
    helpdeskQueries.conversations.get(conversationId),
  );
  // wait until messages are loaded before showing anything
  const messagesQuery = useConversationMessages(conversationId);

  if (!conversationQuery.data?.conversation || !messagesQuery.data) {
    return <FullPageLoader />;
  }

  return (
    <Dialog size="fullscreen" className="h-dialog">
      <DialogBody className="bg" padding="p-0">
        <Content data={conversationQuery.data} />
      </DialogBody>
    </Dialog>
  );
}

interface ContentProps {
  data: FullConversationResponse;
}
function Content({data}: ContentProps) {
  const {close} = useDialogContext();
  return (
    <div className="flex h-full flex-col">
      <InboxSectionHeader gap="gap-4">
        <div className="text-overflow-ellipsis ml-6 mr-24 min-w-0 overflow-hidden">
          <ConversationSubject data={data} />
        </div>
        <Button
          elementType={Link}
          to={getConversationPageLink(data.conversation)}
          onClick={() => {
            // prefetch fast data/messages when opening the full conversation
            const fastOpts = helpdeskQueries.conversations.getFast(
              data.conversation.id,
            );
            const msgOpts = helpdeskQueries.conversations.messages(
              data.conversation.id,
            );
            queryClient.prefetchQuery(fastOpts.queryKey, fastOpts.queryFn as any);
            queryClient.prefetchInfiniteQuery(msgOpts.queryKey, msgOpts.queryFn as any);
            const fullOpts = helpdeskQueries.conversations.get(
              data.conversation.id,
            );
            queryClient.prefetchQuery(fullOpts.queryKey, fullOpts.queryFn as any);
            close();
          }}
          variant="outline"
          startIcon={<OpenInNewIcon />}
          size="xs"
          className="ml-auto"
        >
          <Trans message="Open" />
        </Button>
        <DialogTrigger
          type="modal"
          onClose={merged => {
            if (merged) {
              close();
            }
          }}
        >
          <Button
            variant="outline"
            size="xs"
            className="mr-48"
            startIcon={<MergeIcon />}
          >
            <Trans message="Merge" />
          </Button>
          <ConfirmMergeDialog conversation={data.conversation} />
        </DialogTrigger>
        <IconButton onClick={() => close()}>
          <CloseIcon />
        </IconButton>
      </InboxSectionHeader>
      <ListView data={data} />
    </div>
  );
}

interface ConfirmMergeDialogProps {
  conversation: FullConversationResponse['conversation'];
}
function ConfirmMergeDialog({conversation}: ConfirmMergeDialogProps) {
  const {conversationId} = useRequiredParams(['conversationId']);
  const mergeConversations = useMergeConversations();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      title={<Trans message="Merge conversations" />}
      isLoading={mergeConversations.isPending}
      onConfirm={() => {
        mergeConversations.mutate(
          {conversationId, toMerge: [conversation.id]},
          {onSuccess: response => close(response.conversation)},
        );
      }}
      body={
        <div>
          <Trans message="Are you sure you wnt to merge this conversation with the original one behind the popup?" />
          <p className="mt-12 font-semibold">
            <Trans message="Merged conversations cannot be unmerged." />
          </p>
        </div>
      }
      confirm={<Trans message="Merge" />}
    />
  );
}

function useMergeConversations() {
  return useMutation({
    mutationFn: (payload: {
      conversationId: number | string;
      toMerge: number[];
    }) =>
      apiClient
        .post(`helpdesk/agent/conversations/merge`, payload)
        .then(r => r.data),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
        // don't invalidate queries for merged conversations as it will result in 404
        predicate: query =>
          !query.queryKey.some(k => payload.toMerge.includes(Number(k))),
      });
      toast(message('Merged conversations'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
