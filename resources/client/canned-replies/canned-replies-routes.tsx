import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {queryClient} from '@common/http/query-client';
import {RouteObject} from 'react-router';

export const cannedRepliesRoutes = (forCurrentUser: boolean): RouteObject[] => {
  return [
    {
      path: 'saved-replies',
      shouldRevalidate: shouldRevalidateDatatableLoader,
      lazy: () =>
        import('@app/canned-replies/datatable/canned-replies-datatable-page'),
      handle: {forCurrentUser},
      loader: async () =>
        await queryClient.ensureQueryData(
          helpdeskQueries.cannedReplies.index({forCurrentUser}),
        ),
    },
    {
      path: 'saved-replies/new',
      lazy: () =>
        import('@app/canned-replies/datatable/create-canned-reply-page'),
    },
    {
      path: 'saved-replies/:replyId/update',
      lazy: () =>
        import('@app/canned-replies/datatable/update-canned-reply-page'),
    },
  ];
};
