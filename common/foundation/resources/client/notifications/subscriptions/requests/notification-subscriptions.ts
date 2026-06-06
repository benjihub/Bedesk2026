import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {
  NotificationSubscription,
  NotificationSubscriptionGroup,
} from '@common/notifications/subscriptions/notification-subscription';
import {queryOptions, useQuery} from '@tanstack/react-query';

export interface FetchNotificationSubscriptionsResponse
  extends BackendResponse {
  available_channels: string[];
  subscriptions: NotificationSubscriptionGroup[];
  user_selections: NotificationSubscription[];
}

function fetchNotificationSubscriptions(): Promise<FetchNotificationSubscriptionsResponse> {
  return apiClient
    .get('notifications/me/subscriptions')
    .then(response => response.data);
}

export function useNotificationSubscriptions() {
  return useQuery({
    queryKey: ['notification-subscriptions'],
    queryFn: () => fetchNotificationSubscriptions(),
    staleTime: Infinity,
  });
}

export const notificationSubscriptionsQueryOptions =
  queryOptions<FetchNotificationSubscriptionsResponse>({
    queryKey: ['notification-subscriptions'],
    queryFn: () =>
      apiClient
        .get('notifications/me/subscriptions')
        .then(response => response.data),
    staleTime: Infinity,
  });
