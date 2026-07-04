import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {shouldRevalidateDatatableLoader} from '@common/datatable/filters/utils/should-revalidate-datatable-loader';
import {authGuard} from '@common/auth/guards/auth-route';
import {queryClient} from '@common/http/query-client';
import {message} from '@ui/i18n/message';
import {searchParamsFromUrl} from '@ui/utils/urls/search-params-from-url';
import {redirect, RouteObject} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

const aiAgentSettingsGuard = () =>
  authGuard({permission: 'ai_agent.settings.update'});

const aiAgentManageGuard = () => authGuard({permission: 'ai_agent.update'});

export const aiAgentRoutes: RouteObject[] = [
  {
    path: 'ai-agent',
    children: [
      {
        index: true,
        loader: () => redirect('status'),
        element: <Fragment />,
      },
      {
        path: 'status',
        handle: {customDashboardLayout: true},
        lazy: () => import('./status/ai-agent-status-page'),
        loader: ({request}) => {
          const redirectResponse = aiAgentManageGuard();
          if (redirectResponse) return redirectResponse;
          return queryClient.ensureQueryData(aiAgentQueries.status.index(''));
        },
      },
      {
        path: 'chat',
        handle: {customDashboardLayout: true},
        lazy: () => import('./chat/ai-agent-chat-page'),
        loader: ({request}) => {
          const redirectResponse = aiAgentManageGuard();
          if (redirectResponse) return redirectResponse;
          return queryClient.ensureQueryData(
            aiAgentQueries.settings.index(searchParamsFromUrl(request.url).groupId),
          );
        },
      },
      {
        path: 'settings',
        handle: {customDashboardLayout: true},
        lazy: () => import('./settings/settings-page'),
        loader: ({request}) => {
          const redirectResponse = aiAgentSettingsGuard();
          if (redirectResponse) return redirectResponse;
          return queryClient.ensureQueryData(
            aiAgentQueries.settings.index(searchParamsFromUrl(request.url).groupId),
          );
        },
      },
      {
        path: 'knowledge',
        handle: {customDashboardLayout: true},
        lazy: () => import('./knowledge/knowledge-page'),
        loader: () =>
          queryClient.ensureQueryData(aiAgentQueries.knowledge.index()),
      },

      // flows
      {
        path: 'flows',
        handle: {customDashboardLayout: true},
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./flows/pages/flows-index-page'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.flows.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'flows/:flowId/edit',
        handle: {customDashboardLayout: true},
        lazy: () => import('./flows/pages/update-flow-page'),
        loader: ({params}) => {
          // no need to wait for this to load
          queryClient.ensureQueryData(aiAgentQueries.flows.list());
          queryClient.ensureQueryData(aiAgentQueries.tools.list());
          queryClient.ensureQueryData(
            helpdeskQueries.attributes.normalizedList({
              for: 'agent',
            }),
          );
          return queryClient.ensureQueryData(
            aiAgentQueries.flows.get(params.flowId!),
          );
        },
      },

      // tools
      {
        path: 'tools',
        handle: {customDashboardLayout: true},
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./tools/tools-index-page/tools-index-page'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.tools.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'tools/new',
        lazy: () => import('./tools/editor/tool-editor-page'),
      },
      {
        path: 'tools/:toolId/edit',
        lazy: () => import('./tools/editor/tool-editor-page'),
        loader: ({params}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.tools.get(params.toolId!, 'editor'),
          ),
      },

      // websites
      {
        path: 'knowledge/websites',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./knowledge/websites/websites-datatable'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.websites.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'knowledge/websites/:websiteId/pages',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./knowledge/websites/website-pages-datatable'),
        loader: ({request, params}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.webpages.index(
              params.websiteId!,
              searchParamsFromUrl(request.url),
            ),
          ),
      },
      {
        path: 'knowledge/websites/:websiteId/pages/:webpageId',
        lazy: () => import('./knowledge/websites/webpage-preview'),
        loader: ({params}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.webpages.get(params.websiteId!, params.webpageId!),
          ),
      },

      // documents
      {
        path: 'knowledge/documents',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./knowledge/documents/documents-datatable'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.documents.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'knowledge/documents/:documentId',
        lazy: () => import('./knowledge/documents/document-preview-page'),
        loader: ({params}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.documents.get(params.documentId!),
          ),
      },

      // articles (wrap in parent so relative links work properly in create/update pages)
      {
        path: 'knowledge',
        handle: {breadcrumbRoot: message('Knowledge')},
        children: [
          {
            path: 'articles',
            shouldRevalidate: shouldRevalidateDatatableLoader,
            lazy: () =>
              import(
                '@app/help-center/articles/article-datatable/article-datatable-page'
              ),
            loader: ({request}) =>
              queryClient.ensureQueryData(
                helpCenterQueries.articles.index(
                  searchParamsFromUrl(request.url),
                ),
              ),
          },
          {
            path: 'articles/new',
            handle: {customDashboardLayout: true},
            lazy: () =>
              import(
                '@app/help-center/articles/article-editor/create-article-page'
              ),
            loader: () =>
              queryClient.ensureQueryData(
                helpCenterQueries.categories.normalizedList(),
              ),
          },
          {
            path: 'articles/:articleId/edit',
            handle: {customDashboardLayout: true},
            lazy: () =>
              import(
                '@app/help-center/articles/article-editor/update-article-page'
              ),
            loader: ({params}) =>
              Promise.allSettled([
                queryClient.ensureQueryData(
                  helpCenterQueries.articles.getForUpdateArticlePage({
                    articleId: params.articleId!,
                  }),
                ),
                queryClient.ensureQueryData(
                  helpCenterQueries.categories.normalizedList(),
                ),
              ]),
          },
        ],
      },

      // snippets
      {
        path: 'knowledge/snippets',
        shouldRevalidate: shouldRevalidateDatatableLoader,
        lazy: () => import('./knowledge/snippets/ai-agent-snippets-datatable'),
        loader: ({request}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.snippets.index(searchParamsFromUrl(request.url)),
          ),
      },
      {
        path: 'knowledge/snippets/new',
        lazy: () => import('./knowledge/snippets/create-ai-agent-snippet-page'),
        handle: {customDashboardLayout: true},
      },
      {
        path: 'knowledge/snippets/:snippetId/edit',
        lazy: () => import('./knowledge/snippets/update-ai-agent-snippet-page'),
        handle: {customDashboardLayout: true},
        loader: ({params}) =>
          queryClient.ensureQueryData(
            aiAgentQueries.snippets.get(params.snippetId!),
          ),
      },
    ],
  },
];
