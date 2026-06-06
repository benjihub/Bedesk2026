import {ConversationListItemType} from '@app/dashboard/conversation';
import {get} from '@app/dashboard/helpdesk-queries';
import {ArticleDatatableItem} from '@app/help-center/articles/article-datatable/article-datatable-item';
import {UpdateArticlePageData} from '@app/help-center/articles/article-editor/update-article-page-data';
import {ArticlePageData} from '@app/help-center/articles/article-page/article-page-data';
import {CategoryPageData} from '@app/help-center/categories/category-page-data';
import {HcLandingPageData} from '@app/help-center/homepage/hc-landing-page-data';
import {
  HcManagerArticlesResponse,
  HcManagerCategoriesResponse,
} from '@app/help-center/manager/hc-manager-data';
import {SearchArticlesResponse} from '@app/help-center/search/search-articles-response';
import {
  ArticleSearchParams,
  validateArticleSearchParams,
} from '@app/help-center/search/validate-article-search-params';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {TicketsPortalConversationResponse} from '@app/help-center/tickets-portal/ticket-page/conversation-response';
import {
  TicketsTableSearchParams,
  validateTicketsTableSearch,
} from '@app/help-center/tickets-portal/ticklets-table/tickets-table-schema';
import {getSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {
  DatatableSearchParams,
  validateDatatableSearch,
} from '@common/datatable/filters/utils/validate-datatable-search';
import {
  PaginatedBackendResponse,
  SimplePaginationResponse,
} from '@common/http/backend-response/pagination-response';
import {apiClient} from '@common/http/query-client';
import {keepPreviousData, queryOptions} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export const helpCenterQueries = {
  articles: {
    invalidateKey: ['articles'],
    index: (search: Partial<DatatableSearchParams>) => {
      const params = validateDatatableSearch(search);
      return queryOptions<PaginatedBackendResponse<ArticleDatatableItem>>({
        queryKey: ['articles', params],
        placeholderData: keepPreviousData,
        queryFn: ({signal}) => get('hc/articles', params, signal),
      });
    },
    getForArticlePage: (params: ArticlePageQueryOptionsParams) =>
      articlePageQueryOptions<ArticlePageData>(params, 'articlePage'),
    getForUpdateArticlePage: (params: ArticlePageQueryOptionsParams) =>
      articlePageQueryOptions<UpdateArticlePageData>(params, 'updateArticle'),
    search: (
      search: ArticleSearchParams,
      onSearch?: (r: SearchArticlesResponse) => void,
    ) => {
      const params = validateArticleSearchParams(search);
      return queryOptions({
        queryKey: ['articles', 'search', params],
        placeholderData: keepPreviousData,
        enabled: !!params.query,
        queryFn: async ({signal}) => {
          const response = await get<SearchArticlesResponse>(
            `search/articles`,
            params,
            signal,
          );
          onSearch?.(response);
          return response;
        },
        initialData: () => {
          const data = getBootstrapData().loaders?.searchArticles;
          if (data?.query === search.query) {
            return data;
          }
        },
      });
    },
  },

  categories: {
    invalidateKey: ['articles'],
    landingPageData: () =>
      queryOptions<HcLandingPageData>({
        queryKey: ['articles', 'landing-page'],
        queryFn: () => get('hc'),
        initialData: getBootstrapData().loaders?.hcLandingPage,
      }),
    get: (id: number | string) =>
      queryOptions<CategoryPageData>({
        queryKey: ['articles', 'categories', `${id}`],
        queryFn: () => get(`hc/categories/${id}`),
        initialData: () => {
          const data = getBootstrapData().loaders?.categoryPage;
          if (data?.category?.id == id) {
            return data;
          }
        },
      }),
    normalizedList: () =>
      queryOptions({
        queryKey: ['articles', 'categories', 'normalized'],
        queryFn: () =>
          get<{
            categories: {
              id: number;
              name: string;
              image: string;
              sections: {id: number; name: string; parent_id: number}[];
            }[];
          }>('helpdesk/normalized-models/hc-categories'),
      }),
  },

  manager: {
    invalidateKey: ['articles'],
    categories: () =>
      queryOptions({
        queryKey: ['articles', 'categories', 'manager'],
        queryFn: () =>
          get<HcManagerCategoriesResponse>(`hc/manager/categories`),
      }),
    sections: (categoryId: number | string) =>
      queryOptions({
        queryKey: ['articles', 'sections', 'manager', categoryId],
        queryFn: () =>
          get<HcManagerCategoriesResponse>(
            `hc/manager/categories/${categoryId}/sections`,
          ),
      }),
    articles: (sectionId: number | string) =>
      queryOptions({
        queryKey: ['articles', 'manager', sectionId],
        queryFn: () =>
          get<HcManagerArticlesResponse>(
            `hc/manager/sections/${sectionId}/articles`,
          ),
      }),
  },

  customerConversations: {
    invalidateKey: ['conversations'],
    index: (search: Partial<TicketsTableSearchParams>) => {
      const params = validateTicketsTableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['conversations', 'customer', 'me', params],
        queryFn: () =>
          get<{pagination: SimplePaginationResponse<ConversationListItemType>}>(
            'helpdesk/customer/tickets',
            params,
          ),
      });
    },
    get: (id: number | string) => {
      return queryOptions({
        queryKey: ['conversations', 'customer', 'me', id],
        queryFn: () =>
          get<TicketsPortalConversationResponse>(
            `helpdesk/customer/tickets/${id}`,
          ),
      });
    },
    newTicketPageData: () => {
      const {isInsideSettingsPreview: isAppearanceEditorActive} =
        getSettingsPreviewMode();
      const params = {
        loadAllAttributes: isAppearanceEditorActive ? 'true' : '',
      };
      return queryOptions({
        queryKey: ['customer-new-ticket-page-data', params],
        staleTime: isAppearanceEditorActive ? Infinity : 600000, // 10 minutes
        queryFn: () =>
          get<CustomerNewTicketPageData>(
            'helpdesk/customer-new-ticket-page-config',
            params,
          ),
      });
    },
  },
};

interface ArticlePageQueryOptionsParams {
  articleId: number | string;
  categoryId?: string | number;
  sectionId?: string | number;
}
function articlePageQueryOptions<R>(
  {articleId, categoryId, sectionId}: ArticlePageQueryOptionsParams,
  loader: 'articlePage' | 'updateArticle',
) {
  return queryOptions<R>({
    queryKey: ['articles', articleId, categoryId, sectionId, loader],
    staleTime: Infinity,
    queryFn: () => {
      const url =
        categoryId && sectionId
          ? `hc/articles/${categoryId}/${sectionId}/${articleId}`
          : `hc/articles/${articleId}`;
      return apiClient
        .get(url, {params: {loader}})
        .then(response => response.data);
    },
    initialData: () => {
      const data = getBootstrapData().loaders?.[loader];
      if (!data) return;
      const [category, section] =
        'path' in data.article ? data.article.path : [];
      if (
        data.article.id == articleId &&
        category?.id == categoryId &&
        section?.id == sectionId
      ) {
        return data as R;
      }
    },
  });
}
