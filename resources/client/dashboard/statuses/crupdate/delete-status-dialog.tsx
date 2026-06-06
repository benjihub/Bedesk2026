import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {Status} from '@app/dashboard/statuses/status';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';

interface Props {
  status: Status;
}
export function DeleteStatusDialog({status}: Props) {
  const deleteStatus = useMutation({
    mutationFn: () => apiClient.delete(`helpdesk/statuses/${status.id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.statuses.invalidateKey,
      }),
    onError: err => showHttpErrorToast(err),
  });
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteStatus.isPending}
      title={<Trans message="Delete status" />}
      body={<Trans message="Are you sure you want to delete this status?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => {
        deleteStatus.mutate(undefined, {onSuccess: () => close()});
      }}
    />
  );
}
