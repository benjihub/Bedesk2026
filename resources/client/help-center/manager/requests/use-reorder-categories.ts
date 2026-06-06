import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcManagerCategoriesResponse} from '@app/help-center/manager/hc-manager-data';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useParams} from 'react-router';

interface Response extends BackendResponse {}

interface Payload {
  parentId?: number;
  oldIndex: number;
  newIndex: number;
}
export function useReorderCategories() {
  const {categoryId} = useParams();
  const queryKey = categoryId
    ? helpCenterQueries.manager.sections(categoryId).queryKey
    : helpCenterQueries.manager.categories().queryKey;

  return useMutation({
    mutationFn: (payload: Payload) => {
      // ids are already moved in "onMutate", no need to do it again here
      const ids = queryClient
        .getQueryData<HcManagerCategoriesResponse>(queryKey)!
        .categories.map(c => c.id);
      return reorder({
        parentId: payload.parentId,
        ids,
      });
    },
    onMutate: async ({oldIndex, newIndex}) => {
      await queryClient.cancelQueries({queryKey});
      const previousResponse = queryClient.getQueryData(queryKey);
      queryClient.setQueryData<HcManagerCategoriesResponse>(queryKey, prev => {
        const newData = {...prev, categories: [...(prev?.categories ?? [])]};
        newData.categories = moveItemInNewArray(
          newData.categories,
          oldIndex,
          newIndex,
        );
        return newData;
      });
      return {previousResponse};
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.manager.invalidateKey,
      });
    },
    onError: (err, _, context) => {
      showHttpErrorToast(err);
      queryClient.setQueryData<HcManagerCategoriesResponse>(
        queryKey,
        context?.previousResponse,
      );
    },
  });
}

function reorder(payload: {parentId?: number; ids: number[]}) {
  return apiClient
    .post<Response>(`hc/manager/categories/reorder`, payload)
    .then(r => r.data);
}
