import {useQuery} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {Tag} from '@common/tags/tag';

interface Response extends BackendResponse {
  tags: Tag[];
}

interface Params {
  taggableType: string;
  taggableId: string | number;
  initialData?: Tag[];
  notType?: string;
  type?: string;
}

export function useTaggableTags(params: Params) {
  return useQuery<Response>({
    queryKey: getQueryKey(params),
    queryFn: () => fetchTaggableTags(params),
    initialData: params.initialData ? {tags: params.initialData} : undefined,
  });
}

function getQueryKey(params: Params) {
  const {taggableType, taggableId, type, notType} = params;
  const key = ['tags', 'taggable', taggableType, `${taggableId}`];
  if (type != null) {
    key.push(type);
  }
  if (notType != null) {
    key.push(notType);
  }
  return key;
}

export function invalidateTaggableTagsQuery({
  taggableType,
  taggableIds,
}: {
  taggableType: string;
  taggableIds: (string | number)[];
}) {
  return Promise.allSettled(
    taggableIds.map(taggableId =>
      queryClient.invalidateQueries({
        queryKey: getQueryKey({taggableType, taggableId}),
      }),
    ),
  );
}

async function fetchTaggableTags({
  taggableType,
  taggableId,
  notType,
  type,
}: Params) {
  return apiClient
    .get<Response>(`taggable/${taggableType}/${taggableId}/list-tags`, {
      params: {
        notType,
        type,
      },
    })
    .then(response => response.data);
}
