import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {closeDialog} from '@ui/overlays/store/dialog-store';
import {ConversationMessage} from '../conversation-message';

interface Props {
  message: ConversationMessage;
}
export function ConfirmDeleteMessageDialog({message}: Props) {
  const deleteMessage = useMutation({
    mutationFn: (payload: {message: ConversationMessage}) =>
      apiClient
        .delete(`helpdesk/agent/messages/${payload.message.id}`)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });

  let title = <Trans message="Delete message" />;
  let body = <Trans message="Are you sure you want to delete this message?" />;
  if (message.type === 'note') {
    title = <Trans message="Delete note" />;
    body = <Trans message="Are you sure you want to delete this note?" />;
  }
  return (
    <ConfirmationDialog
      isDanger
      title={title}
      body={body}
      confirm={<Trans message="Delete" />}
      onConfirm={() =>
        deleteMessage.mutate(
          {message},
          {
            onSuccess: () => closeDialog(),
          },
        )
      }
      isLoading={deleteMessage.isPending}
    />
  );
}
