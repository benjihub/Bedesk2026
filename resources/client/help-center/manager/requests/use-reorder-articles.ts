import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcManagerArticlesResponse} from '@app/help-center/manager/hc-manager-data';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';

interface Response extends BackendResponse {}

const getQueryKey = (sectionId: number | string) =>
  helpCenterQueries.manager.articles(sectionId).queryKey;

interface Payload {
  sectionId: number | string;
  oldIndex: number;
  newIndex: number;
}
export function useReorderArticles() {
  return useMutation({
    mutationFn: (payload: Payload) => {
      // ids are already moved in "onMutate", no need to do it again here
      const ids = queryClient
        .getQueryData<HcManagerArticlesResponse>(
          getQueryKey(payload.sectionId),
        )!
        .articles.map(a => a.id);
      return reorder({
        sectionId: payload.sectionId,
        ids,
      });
    },
    onMutate: async ({oldIndex, newIndex, sectionId}) => {
      const queryKey = getQueryKey(sectionId);
      await queryClient.cancelQueries({queryKey});
      const previousResponse = queryClient.getQueryData(queryKey);
      queryClient.setQueryData<HcManagerArticlesResponse>(queryKey, prev => {
        if (!prev) return;
        const newData = {...prev, articles: prev.articles};
        newData.articles = moveItemInNewArray(
          newData.articles,
          oldIndex,
          newIndex,
        );
        return newData;
      });
      return {previousResponse};
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['articles']});
    },
    onError: (err, payload, context) => {
      showHttpErrorToast(err);
      queryClient.setQueryData(
        getQueryKey(payload.sectionId),
        context?.previousResponse,
      );
    },
  });
}

function reorder(payload: {sectionId: number | string; ids: number[]}) {
  return apiClient
    .post<Response>(
      `hc/manager/sections/${payload.sectionId}/articles/reorder`,
      payload,
    )
    .then(r => r.data);
}
