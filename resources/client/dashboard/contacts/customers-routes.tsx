import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {validateDatatableSearchWithSimplePagination} from '@common/datatable/filters/utils/validate-datatable-search';
import {queryClient} from '@common/http/query-client';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {RouteObject} from 'react-router';

export const customersRoutes: RouteObject[] = [
  {
    path: 'customers',
    children: [
      {
        index: true,
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import(
            '@app/dashboard/contacts/customers-datatable/customers-datatable-page'
          ),
        loader: async ({request}) => {
          queryClient.ensureQueryData(
            helpdeskQueries.customers.index(searchParamsFromUrl(request.url)),
          );
        },
      },
      {
        path: ':userId',
        handle: {customDashboardLayout: true},
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () =>
          import(
            '@app/dashboard/contacts/customer-profile-page/customer-profile-page'
          ),
        loader: ({params, request}) => {
          Promise.allSettled([
            queryClient.ensureQueryData(
              helpdeskQueries.customers.indexConversations(
                params.userId!,
                validateDatatableSearchWithSimplePagination(
                  searchParamsFromUrl(request.url),
                ),
              ),
            ),
            queryClient.ensureQueryData(
              helpdeskQueries.customers.get(params.userId!),
            ),
          ]);
        },
      },
    ],
  },
];
