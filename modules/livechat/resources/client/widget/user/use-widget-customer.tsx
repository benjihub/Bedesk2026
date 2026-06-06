import {apiClient, queryClient} from '@common/http/query-client';
import {WidgetCustomer} from '@livechat/widget/user/widget-customer';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';

interface ExternalVisitorData {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface UseWidgetCustomerResponse {
  user: WidgetCustomer;
}

export function useWidgetCustomer(): WidgetCustomer | null {
  return useQuery(widgetQueries.customers.get()).data?.user ?? null;
}

export function getWidgetCustomer() {
  return queryClient.getQueryData<UseWidgetCustomerResponse>(
    widgetQueries.customers.get().queryKey,
  )!.user;
}

export async function syncWidgetCustomerWithExternalData(
  newData: ExternalVisitorData,
) {
  if (externalDataNeedsSyncing(newData)) {
    apiClient
      .post<UseWidgetCustomerResponse>(
        `lc/widget/customers/sync-external-data`,
        newData,
      )
      .then(response => {
        queryClient.setQueryData<UseWidgetCustomerResponse>(
          widgetQueries.customers.get().queryKey,
          response.data,
        );
      });
  }
}

function externalDataNeedsSyncing(d: ExternalVisitorData): boolean {
  const customer = getWidgetCustomer();
  if (
    Object.keys(d).some(key => {
      if (key === 'email') {
        return customer.email !== d.email;
      }

      if (key === 'name') {
        return customer.name !== d.name;
      }

      return true;
    })
  ) {
    return true;
  }

  return false;
}
