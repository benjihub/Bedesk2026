import {NotFoundPage} from '@common/ui/not-found-page/not-found-page';
import {RouteObject} from 'react-router';

export const commonRoutes: RouteObject[] = [
  {
    path: 'contact',
    lazy: () => import('@common/contact/contact-us-page'),
  },
  {
    path: 'pages/:pageSlug',
    lazy: () => import('@common/custom-page/custom-page-layout'),
  },
  {
    path: 'pages/:pageId/:pageSlug',
    lazy: () => import('@common/custom-page/custom-page-layout'),
  },
  {
    path: '404',
    element: <NotFoundPage />,
  },
];
