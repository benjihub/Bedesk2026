import {subscribedGuard} from '@common/auth/guards/subscribed-route';
import {RouteObject} from 'react-router';

export const billingPageRoutes: RouteObject[] = [
  {
    path: 'pricing',
    lazy: () => import('@common/billing/pricing-table/pricing-page'),
  },
  {
    path: 'billing',
    loader: () => subscribedGuard(),
    lazy: () => import('@common/billing/billing-page/billing-page-layout'),
    children: [
      {
        index: true,
        lazy: () => import('@common/billing/billing-page/billing-page'),
      },
      {
        path: 'change-payment-method',
        lazy: () =>
          import(
            '@common/billing/billing-page/change-payment-method/change-payment-method-layout'
          ),
        children: [
          {
            index: true,
            lazy: () =>
              import(
                '@common/billing/billing-page/change-payment-method/change-payment-method-page'
              ),
          },
          {
            path: 'done',
            lazy: () =>
              import(
                '@common/billing/billing-page/change-payment-method/change-payment-method-done'
              ),
          },
        ],
      },
      {
        path: 'change-plan',
        lazy: () => import('@common/billing/billing-page/change-plan-page'),
      },
      {
        path: 'change-plan/:productId/:priceId/confirm',
        lazy: () =>
          import('@common/billing/billing-page/confirm-plan-change-page'),
      },
      {
        path: 'cancel',
        lazy: () =>
          import('@common/billing/billing-page/confirm-plan-cancellation-page'),
      },
      {
        path: 'renew',
        lazy: () =>
          import('@common/billing/billing-page/confirm-plan-renewal-page'),
      },
    ],
  },
];
