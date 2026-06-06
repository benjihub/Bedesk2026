import {CannedReply} from '@app/canned-replies/canned-reply';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {SimplePaginationResponse} from '@common/http/backend-response/pagination-response';
import {queryClient} from '@common/http/query-client';
import {useQuery} from '@tanstack/react-query';
import {useFilter} from '@ui/i18n/use-filter';

export function useCannedReplies(searchTerm: string = '') {
  const {contains} = useFilter({sensitivity: 'base'});

  const query = useQuery({
    ...helpdeskQueries.cannedReplies.index({
      query: searchTerm,
      forCurrentUser: true,
    }),
    initialData: () => {
      const initial = queryClient.getQueryData<{
        pagination: SimplePaginationResponse<CannedReply>;
      }>(
        helpdeskQueries.cannedReplies.index({query: '', forCurrentUser: true})
          .queryKey,
      );
      if (initial && !initial.pagination.next_page) {
        return {
          ...initial,
          pagination: {
            ...initial.pagination,
            data: initial.pagination.data.filter(reply =>
              contains(reply.name, searchTerm),
            ),
          },
        };
      }

      return undefined;
    },
  });

  return {
    replies: query.data?.pagination.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
  };
}
