import {queryClient} from '@common/http/query-client';
import {notificationSubscriptionsQueryOptions} from '@common/notifications/subscriptions/requests/notification-subscriptions';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {replace, RouteObject} from 'react-router';
import {authGuard, AuthRoute} from '../auth/guards/auth-route';
import {ActiveWorkspaceProvider} from '../workspace/active-workspace-id-context';
import {NotificationsPage} from './notifications-page';

export const notificationRoutes: RouteObject[] = [
  {
    path: '/notifications',
    element: (
      <AuthRoute>
        <ActiveWorkspaceProvider>
          <NotificationsPage />
        </ActiveWorkspaceProvider>
      </AuthRoute>
    ),
  },
  {
    path: '/notifications/settings',
    loader: () => {
      const redirect = authGuard();
      if (redirect) return redirect;

      if (!getBootstrapData()?.settings.notif.subs.integrated) {
        return replace('/');
      }

      return queryClient.ensureQueryData(notificationSubscriptionsQueryOptions);
    },
    lazy: () =>
      import('@common/notifications/subscriptions/notification-settings-page'),
  },
];
