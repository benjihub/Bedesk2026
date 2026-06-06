import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';

type BatchAction = {
  action: string;
  articleIds: (number | string)[];
  data: unknown;
};

export const batchActions = {
  changeArticleStatus: (
    articleIds: (number | string)[],
    status: 'draft' | 'published',
  ) => ({
    action: 'changeArticleStatus',
    articleIds,
    data: {
      status,
    },
  }),
  changeVisibility: (
    articleIds: (number | string)[],
    roleId: string | number,
  ) => ({
    action: 'changeVisibility',
    articleIds,
    data: {
      roleId,
    },
  }),
};

export const usePerformBatchAction = () => {
  return useMutation({
    mutationFn: (action: BatchAction) => {
      return apiClient
        .post('hc/articles/batch-action', {...action})
        .then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpCenterQueries.manager.invalidateKey,
      });
    },
    onError: r => showHttpErrorToast(r),
  });
};
