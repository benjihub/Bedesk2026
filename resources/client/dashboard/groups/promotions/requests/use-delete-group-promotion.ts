import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';

export function useDeleteGroupPromotion(groupId: number) {
  return useMutation({
    mutationFn: (promotionId: number) =>
      apiClient
        .delete(`helpdesk/groups/${groupId}/promotions/${promotionId}`)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groupPromotions.invalidateKey(groupId),
      });
    },
  });
}
