import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';
import {CreateGroupPromotionPayload} from './use-create-group-promotion';

export function useUpdateGroupPromotion(
  groupId: number,
  promotionId: number,
  form: UseFormReturn<CreateGroupPromotionPayload>,
) {
  return useMutation({
    mutationFn: (payload: CreateGroupPromotionPayload) =>
      apiClient
        .put(`helpdesk/groups/${groupId}/promotions/${promotionId}`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groupPromotions.invalidateKey(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.promotions.invalidateKey,
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
