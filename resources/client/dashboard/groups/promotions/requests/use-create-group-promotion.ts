import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export interface CreateGroupPromotionPayload {
  title: string;
  description?: string | null;
  discount?: number | null;
  code?: string | null;
  terms?: string | null;
  how_to_claim?: string | null;
  active?: boolean;
}

export function useCreateGroupPromotion(
  groupId: number,
  form: UseFormReturn<CreateGroupPromotionPayload>,
) {
  return useMutation({
    mutationFn: (payload: CreateGroupPromotionPayload) =>
      apiClient
        .post(`helpdesk/groups/${groupId}/promotions`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groupPromotions.invalidateKey(groupId),
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
