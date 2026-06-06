import {ConversationSummary} from '@ai/conversation-summary-panel/conversation-summary';
import {CompactAttribute} from '@app/attributes/compact-attribute';
import {DatatableAttribute} from '@app/attributes/datatable/datatable-attribute';
import {
  AttributesSearchParams,
  validateAttributesSearch,
} from '@app/attributes/utils/validate-attributes-search';
import {CannedReply} from '@app/canned-replies/canned-reply';
import {validateCannedRepliesIndexSearch} from '@app/canned-replies/datatable/validate-canned-replies-index-search';
import {AgentsTableItem} from '@app/dashboard/agents/agent-index-page/agents-table-item';
import {AgentInvite} from '@app/dashboard/agents/invites/agent-invite';
import {CustomerProfile} from '@app/dashboard/contacts/customer-profile-page/customer-profile';
import {validateCustomersSearch} from '@app/dashboard/contacts/customers-datatable/validate-customers-search';
import {
  ConversationListItemType,
  ConversationTag,
  FullConversationResponse,
  TicketMilestonesResponse,
} from '@app/dashboard/conversation';
import {
  validateAgentConversationsSearch,
  validateSearchConversationsParams,
} from '@app/dashboard/conversations/agent-conversations-search-schema';
import {PageVisit} from '@app/dashboard/conversations/conversation-page/details-sidebar/page-visists-panel';
import type {RecentConversation} from '@app/dashboard/conversations/conversation-page/details-sidebar/recent-conversations-panel';
import type {OriginalReplyEmailResponse} from '@app/dashboard/conversations/conversation-page/messages/actions/original-email-preview-dialog';
import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {Group, GroupUser, NormalizedGroup} from '@app/dashboard/groups/group';
import {GroupsTableItem} from '@app/dashboard/groups/groups-index-page/groups-table-item';
import {GroupPromotion} from '@app/dashboard/groups/promotions/group-promotion';
import {GroupAiAgentSettingsResponse} from '@app/dashboard/groups/settings/group-ai-agent-settings';
import {GroupSettings} from '@app/dashboard/groups/settings/group-settings';
import {SearchReportItem} from '@app/dashboard/reports/search-report-page';
import {Status} from '@app/dashboard/statuses/status';
import {CompactAgent, FullAgent} from '@app/dashboard/types/agent';
import {CampaignTemplate} from '@app/dashboard/types/campaign-template';
import {GetStatusesList} from '@app/dashboard/types/statuses';
import {GetInboxViewsResponse} from '@app/dashboard/types/views';
import {View} from '@app/dashboard/views/view';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {
  CursorPaginationResponse,
  getNextPageParam,
  PaginatedBackendResponse,
} from '@common/http/backend-response/pagination-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {EnvatoPurchaseCode} from '@envato/envato-purchase-code';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {
  DateRangeValue,
  dateRangeValueToPayload,
} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {NormalizedModel} from '@ui/types/normalized-model';
import {User} from '@ui/types/user';

export const get = async <T>(
  url: string,
  params?: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<T> => {
  if (params?.query) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return (await apiClient.get(url, {params, signal})).data;
};

export const helpdeskQueries = {
  views: {
    invalidateKey: ['views'],
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        queryKey: ['views', params],
        placeholderData: keepPreviousData,
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<View>>(`helpdesk/views`, params, signal),
      });
    },
    get: (viewId: string | number) => {
      return queryOptions({
        queryKey: ['views', viewId],
        queryFn: () => get<{view: View}>(`helpdesk/views/${viewId}`),
      });
    },
  },

  conversations: {
    invalidateKey: ['conversations'],
    index: (search: Record<string, string>) => {
      const params = validateAgentConversationsSearch(search);
      return queryOptions({
        queryKey: ['conversations', 'agent', params],
        queryFn: () =>
          get<
            PaginatedBackendResponse<ConversationListItemType> & {
              columns?: string[];
            }
          >('helpdesk/agent/conversations', params),
      });
    },
    infiniteIndex: (search: Record<string, string>) => {
      const params = validateAgentConversationsSearch(search);
      return {
        queryKey: ['conversations', 'agent', 'infinite', params],
        queryFn: ({pageParam}: {pageParam: number | string | undefined}) =>
          apiClient
            .get<PaginatedBackendResponse<ConversationListItemType>>(
              'helpdesk/agent/conversations',
              {
                params: {...params, page: pageParam},
              },
            )
            .then(r => r.data),
        getNextPageParam: getNextPageParam,
        initialPageParam: 1,
        initialData: () => {
          const firstPageResponse = queryClient.getQueryData(
            helpdeskQueries.conversations.index({...params, page: '1'})
              .queryKey,
          );
          if (!firstPageResponse) {
            return;
          }
          return {
            pageParams: [undefined, 1],
            pages: [firstPageResponse],
          };
        },
      };
    },
    get: (conversationId: string | number) => {
      return queryOptions({
        queryKey: ['conversations', 'agent', `${conversationId}`, 'full'],
        queryFn: () =>
          get<FullConversationResponse>(
            `helpdesk/agent/conversations/${conversationId}`,
          ),
      });
    },
    getFast: (conversationId: string | number) => {
      return queryOptions({
        queryKey: ['conversations', 'agent', `${conversationId}`, 'fast'],
        queryFn: () =>
          get<Partial<FullConversationResponse>>(
            `helpdesk/agent/conversations/${conversationId}`,
            {fast: 1},
          ),
      });
    },
    search: (search: Record<string, string>) => {
      const params = validateSearchConversationsParams(search);
      return queryOptions({
        queryKey: ['conversations', 'search', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<ConversationListItemType>>(
            'search/conversations',
            params,
            signal,
          ),
      });
    },
    messages: (conversationId: string | number) =>
      infiniteQueryOptions({
        queryKey: ['conversations', 'agent', `${conversationId}`, 'messages'],
        queryFn: ({pageParam}) =>
          get<{pagination: CursorPaginationResponse<ConversationContentItem>}>(
            `helpdesk/agent/conversations/${conversationId}/messages`,
            pageParam ? {cursor: pageParam} : undefined,
          ),
        initialPageParam: null,
        getNextPageParam: getNextPageParam,
        // ensure fresh data on mount and focus, and when connection resumes
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
        staleTime: 0,
      }),
    agentConversationList: (agentId: number | string) => {
      return infiniteQueryOptions({
        queryKey: ['conversations', 'agent', 'list', `${agentId}`],
        queryFn: ({pageParam}) =>
          get<PaginatedBackendResponse<ConversationListItemType>>(
            `helpdesk/agent/${agentId}/conversation-list`,
            pageParam ? {cursor: pageParam} : undefined,
          ),
        initialPageParam: null,
        getNextPageParam: getNextPageParam,
      });
    },
    inboxViews: queryOptions({
      queryKey: ['conversations', 'inbox', 'views'],
      queryFn: () => get<GetInboxViewsResponse>('helpdesk/inbox/views'),
    }),
    recent: (userId: number | string, excludeId?: number) => {
      return queryOptions({
        queryKey: ['conversations', 'recent', userId, excludeId],
        queryFn: () =>
          get<{conversations: RecentConversation[]}>(
            `helpdesk/agent/conversations/recent/${userId}`,
            {excludeId: `${excludeId}`},
          ),
      });
    },
    originalReplyEmail: (replyId: number | string) =>
      queryOptions({
        queryKey: ['original-email', `${replyId}`],
        queryFn: () =>
          get<OriginalReplyEmailResponse>(
            `helpdesk/agent/messages/${replyId}/email`,
          ),
        staleTime: Infinity,
      }),
    summary: (
      conversationId: number | string,
      initialData?: ConversationSummary | null,
    ) => {
      return queryOptions({
        queryKey: ['conversations', `${conversationId}`, 'summary'],
        queryFn: () =>
          get<{summary: ConversationSummary}>(
            `helpdesk/conversations/${conversationId}/summary`,
          ),
        initialData: initialData ? () => ({summary: initialData}) : undefined,
      });
    },
    milestones: (conversationId: number | string) => {
      return queryOptions({
        queryKey: ['conversations', 'agent', `${conversationId}`, 'milestones'],
        queryFn: () =>
          get<TicketMilestonesResponse>(
            `admin/tickets/${conversationId}/milestones`,
          ),
      });
    },
  },

  customers: {
    invalidateKey: ['users', 'customers'],
    index: (search: Record<string, string>) => {
      const params = validateCustomersSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['users', 'customers', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<User>>(
            'helpdesk/customers',
            params,
            signal,
          ),
      });
    },
    get: (userId: number | string) =>
      queryOptions<{user: CustomerProfile}>({
        queryKey: ['users', 'customers', `${userId}`],
        queryFn: () => get(`helpdesk/customers/${userId}`),
      }),
    indexConversations: (
      userId: number | string,
      search: Record<string, string>,
    ) => {
      const params = validateDatatableSearch(search);
      return queryOptions<PaginatedBackendResponse<ConversationListItemType>>({
        placeholderData: keepPreviousData,
        queryKey: ['conversations', 'customers', `${userId}`, params],
        queryFn: ({signal}) =>
          get(`helpdesk/customers/${userId}/conversations`, params, signal),
      });
    },
    indexSearches: (
      userId: number | string,
      search: Record<string, string>,
    ) => {
      const params = {
        ...validateDatatableSearch(search),
        userId,
      };
      return queryOptions<PaginatedBackendResponse<SearchReportItem>>({
        placeholderData: keepPreviousData,
        queryKey: ['reports', 'search', params],
        queryFn: ({signal}) => get(`reports/search/popular`, params, signal),
      });
    },
  },

  tags: {
    invalidateKey: ['tags'],
    index: (query: string = '') =>
      queryOptions({
        queryKey: ['tags', query],
        queryFn: () =>
          get<PaginatedBackendResponse<ConversationTag>>(`tags`, {
            query,
            paginate: 'simple',
            perPage: 25,
          }),
      }),
  },

  cannedReplies: {
    invalidateKey: ['canned-replies'],
    index: (search: Record<string, unknown>) => {
      const params = validateCannedRepliesIndexSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['canned-replies', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<CannedReply>>(
            'helpdesk/canned-replies',
            params,
            signal,
          ),
      });
    },
    get: (replyId: number | string) => {
      return queryOptions({
        queryKey: ['canned-replies', `${replyId}`],
        queryFn: () =>
          get<{reply: CannedReply}>(`helpdesk/canned-replies/${replyId}`),
      });
    },
  },

  campaigns: {
    invalidateKey: ['campaigns'],
    index: (search: Record<string, unknown> = {}) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['campaigns', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<Campaign>>(
            'lc/campaigns',
            params,
            signal,
          ),
      });
    },
    get: (campaignId: number | string) => {
      return queryOptions({
        queryKey: ['campaigns', `${campaignId}`],
        staleTime: Infinity,
        queryFn: () => get<{campaign: Campaign}>(`lc/campaigns/${campaignId}`),
      });
    },
    templates: queryOptions({
      queryKey: ['campaign-templates'],
      staleTime: Infinity,
      queryFn: () =>
        get<{templates: CampaignTemplate[]}>('lc/campaign-templates'),
    }),
  },

  statuses: {
    invalidateKey: ['statuses'],
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['statuses', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<Status>>(
            'helpdesk/statuses',
            params,
            signal,
          ),
      });
    },
    dropdownList: (label: 'agent' | 'user') => {
      return queryOptions({
        staleTime: Infinity,
        queryKey: ['statuses', 'list', label],
        queryFn: () => get<GetStatusesList>('helpdesk/statuses/list', {label}),
      });
    },
  },

  groups: {
    invalidateKey: ['groups'],
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['groups', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<GroupsTableItem>>(
            'helpdesk/groups',
            params,
            signal,
          ),
      });
    },
    get: (groupId: number | string) =>
      queryOptions({
        queryKey: ['groups', `${groupId}`],
        queryFn: () => get<{group: Group}>(`helpdesk/groups/${groupId}`),
      }),
    normalizedList: queryOptions({
      queryKey: ['groups', 'normalized-models', 'helpdesk'],
      staleTime: Infinity,
      queryFn: () =>
        get<{groups: NormalizedGroup[]; defaultGroupId: number}>(
          'helpdesk/normalized-models/groups',
        ),
    }),
  },

  groupPromotions: {
    invalidateKey: (groupId: number | string) => ['group-promotions', `${groupId}`],
    index: (groupId: number | string) =>
      queryOptions({
        queryKey: ['group-promotions', `${groupId}`],
        queryFn: () =>
          get<{promotions: GroupPromotion[]}>(
            `helpdesk/groups/${groupId}/promotions`,
          ),
      }),
  },

  dashboard: {
    stats: queryOptions({
      queryKey: ['helpdesk', 'dashboard-stats'],
      staleTime: 30_000,
      refetchInterval: 30_000,
      queryFn: () => get<{
        active_users: number;
        open_tickets: number;
        total_tickets: number;
        ai_responses: number;
        promotions: number;
      }>('helpdesk/dashboard-stats'),
    }),
  },

  groupSettings: {
    invalidateKey: (groupId: number | string) => ['group-settings', `${groupId}`],
    get: (groupId: number | string) =>
      queryOptions({
        queryKey: ['group-settings', `${groupId}`],
        queryFn: () =>
          get<GroupSettings>(`helpdesk/groups/${groupId}/settings`),
      }),
  },

  groupAiAgentSettings: {
    invalidateKey: (groupId: number | string) => [
      'group-ai-agent-settings',
      `${groupId}`,
    ],
    get: (groupId: number | string) =>
      queryOptions({
        queryKey: ['group-ai-agent-settings', `${groupId}`],
        queryFn: () =>
          get<GroupAiAgentSettingsResponse>(
            `helpdesk/groups/${groupId}/ai-agent-settings`,
          ),
      }),
  },

  promotions: {
    invalidateKey: ['promotions'],
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['promotions', params],
        queryFn: ({signal}) =>
          get<
            PaginatedBackendResponse<GroupPromotion & {group_name?: string}>
          >('helpdesk/promotions', params, signal),
      });
    },
  },

  roles: {
    invalidateKey: ['roles'],
    normalizedList: (type: 'agents' | 'all') =>
      queryOptions({
        queryKey: ['roles', 'normalized-models', 'helpdesk'],
        staleTime: Infinity,
        queryFn: () =>
          get<{roles: {id: number; name: string}[]; defaultRoleId: number}>(
            'helpdesk/normalized-models/roles',
            {type},
          ),
      }),
  },

  agents: {
    invalidateKey: ['users'],
    get: (agentId: number | string) => {
      return queryOptions({
        queryKey: ['users', 'agents', `${agentId}`],
        queryFn: () => get<{agent: FullAgent}>(`helpdesk/agents/${agentId}`),
      });
    },
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['users', 'agents', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AgentsTableItem>>(
            'helpdesk/agents',
            params,
            signal,
          ),
      });
    },
    compact: queryOptions<{agents: CompactAgent[]}>({
      queryKey: ['users', 'agents', 'compact'],
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
      queryFn: () => get('helpdesk/compact-agents'),
      initialData: () => {
        const initialAgents = (getBootstrapData() as any)
          .agents as CompactAgent[];
        return initialAgents ? {agents: initialAgents} : undefined;
      },
    }),
    normalizedList: queryOptions({
      queryKey: ['users', 'normalized-models', 'agents'],
      staleTime: Infinity,
      queryFn: () =>
        get<{
          agents: GroupUser[];
        }>('helpdesk/normalized-models/agents'),
    }),
  },

  agentInvites: {
    invalidateKey: ['agent-invites'],
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['agent-invites', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AgentInvite>>(
            'helpdesk/agents/invites',
            params,
            signal,
          ),
      });
    },
  },

  attributes: {
    invalidateKey: ['attributes'],
    normalizedList: (search: AttributesSearchParams) => {
      const params = validateAttributesSearch(search);
      return queryOptions({
        queryKey: ['attributes', 'normalized-models', params],
        staleTime: Infinity,
        queryFn: () =>
          get<{attributes: CompactAttribute[]}>(
            'helpdesk/attributes/list',
            params,
          ),
      });
    },
    index: (search: Record<string, string>) => {
      const params = validateDatatableSearch(search);
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['attributes', 'index', params],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<DatatableAttribute>>(
            'helpdesk/attributes',
            params,
            signal,
          ),
      });
    },
    get: (attributeId: string | number) => {
      return queryOptions({
        queryKey: ['attributes', attributeId],
        queryFn: () =>
          get<{attribute: DatatableAttribute}>(
            `helpdesk/attributes/${attributeId}`,
          ),
      });
    },
  },

  reports: {
    get: <T>(
      endpoint: string,
      dateRange: DateRangeValue,
      userParams?: Record<string, string | number>,
    ) => {
      const params = {
        ...dateRangeValueToPayload({dateRange}),
        ...userParams,
      };
      return queryOptions<T>({
        queryKey: [endpoint, params],
        placeholderData: keepPreviousData,
        queryFn: () => get(endpoint, params),
      });
    },
  },

  pageVisits: {
    invalidateKey: ['page-visits'],
    index: (userId: number | string, search: Record<string, string>) => {
      return queryOptions({
        placeholderData: keepPreviousData,
        queryKey: ['page-visits', `${userId}`, search],
        queryFn: () =>
          get<PaginatedBackendResponse<PageVisit>>(
            `helpdesk/agent/visits/${userId}`,
            search,
          ),
      });
    },
  },

  envato: {
    invalidateKey: ['envato'],
    items: {
      normalizedList: () =>
        queryOptions({
          staleTime: Infinity,
          queryKey: ['envato', 'items', 'normalized-models'],
          queryFn: () =>
            get<{items: NormalizedModel[]}>(
              'helpdesk/normalized-models/envato-items',
            ),
        }),
    },
    userPurchases: (userId: number | string) => {
      return queryOptions({
        queryKey: ['envato', 'user-purchases', `${userId}`],
        queryFn: () =>
          get<{purchases: EnvatoPurchaseCode[]}>(
            `users/${userId}/envato/purchases`,
          ),
      });
    },
  },
};
