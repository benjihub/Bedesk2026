import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {useMutation} from '@tanstack/react-query';

interface Payload extends Partial<Campaign> {}

export function useUpdateCampaign(campaignId: number | string) {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient.put(`lc/campaigns/${campaignId}`, payload).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.campaigns.invalidateKey,
      });
    },
    onError: r => showHttpErrorToast(r),
  });
}
