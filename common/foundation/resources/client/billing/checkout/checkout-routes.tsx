import {notSubscribedGuard} from '@common/auth/guards/not-subscribed-route';
import {RouteObject} from 'react-router';

export const checkoutRoutes: RouteObject[] = [
  {
    path: 'checkout/:productId/:priceId',
    loader: () => notSubscribedGuard(),
    lazy: () => import('@common/billing/checkout/checkout'),
  },
  {
    path: 'checkout/:productId/:priceId/stripe/done',
    loader: () => notSubscribedGuard(),
    lazy: () => import('@common/billing/checkout/stripe/checkout-stripe-done'),
  },
  {
    path: 'checkout/:productId/:priceId/paypal/done',
    loader: () => notSubscribedGuard(),
    lazy: () => import('@common/billing/checkout/paypal/checkout-paypal-done'),
  },
];
