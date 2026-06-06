import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {toast} from '@ui/toast/toast';

interface Props {
  campaignId: number;
}
export function DeleteCampaignDialog({campaignId}: Props) {
  const {close} = useDialogContext();
  const deleteCampaign = useMutation({
    mutationFn: () => apiClient.delete(`lc/campaigns/${campaignId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.campaigns.invalidateKey,
      });
      toast(message('Campaign deleted'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isLoading={deleteCampaign.isPending}
      title={<Trans message="Delete campaign?" />}
      body={
        <Trans message="This will permanently delete the campaign and cannot be undone." />
      }
      confirm={<Trans message="Delete" />}
      isDanger
      onConfirm={() => deleteCampaign.mutate()}
    />
  );
}
