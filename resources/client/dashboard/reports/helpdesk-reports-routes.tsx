import {Navigate, Outlet, RouteObject} from 'react-router';

export const helpdeskReportRoutes: RouteObject[] = [
  {
    path: 'reports',
    //lazy: () => import('@app/dashboard/reports/helpdesk-report-page'),
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Navigate to="tickets" replace />,
      },
      {
        path: 'chats',
        lazy: () =>
          import('@app/dashboard/reports/conversations-overview-report-page'),
      },
      {
        path: 'tickets',
        lazy: () =>
          import('@app/dashboard/reports/conversations-overview-report-page'),
      },
      {
        path: 'ticket-milestones',
        lazy: () =>
          import('@app/dashboard/reports/ticket-milestones-report-page'),
      },
      {
        path: 'teammates',
        lazy: () =>
          import(
            '@app/dashboard/reports/team/teammate-performance-report-page'
          ),
      },
      {
        path: 'campaigns',
        lazy: () =>
          import('@livechat/dashboard/reports/all-campaigns-report-page'),
      },
      {
        path: 'campaigns/:campaignId',
        lazy: () => import('@livechat/dashboard/reports/campaign-report-page'),
      },
      {
        path: 'ai-agent',
        lazy: () => import('@ai/ai-agent/reports/ai-agent-report-page'),
      },
      {
        path: 'tags',
        lazy: () => import('@app/dashboard/reports/tags-report-page'),
      },
      {
        path: 'articles',
        lazy: () => import('@app/dashboard/reports/articles-report-page'),
      },
      {
        path: 'search',
        element: <Navigate to="popular" replace />,
      },
      {
        path: 'search/popular',
        lazy: () =>
          import('@app/dashboard/reports/search-report-page').then(
            ({PopularSearchReportPage}) => ({
              Component: PopularSearchReportPage,
            }),
          ),
      },
      {
        path: 'search/failed',
        lazy: () =>
          import('@app/dashboard/reports/search-report-page').then(
            ({FailedSearchReportPage}) => ({
              Component: FailedSearchReportPage,
            }),
          ),
      },
      {
        path: 'analytics',
        lazy: () =>
          import('@app/dashboard/reports/google-analytics-report-page'),
      },
      {
        path: 'envato',
        lazy: () => import('@app/dashboard/reports/envato-report-page'),
      },
    ],
  },
];
