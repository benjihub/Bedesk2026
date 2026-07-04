import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {AiAgentTool} from '@ai/ai-agent/tools/ai-agent-tool';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {get} from '@common/http/queries-file-helpers';
import {queryOptions} from '@tanstack/react-query';
import {AiAgentFlow, FlowAttachment} from './flows/ai-agent-flow';
import {AiAgentDocument} from './knowledge/documents/ai-agent-document';
import {AiAgentSnippet} from './knowledge/snippets/ai-agent-snippet';
import {Knowledge} from './knowledge/use-knowledge';
import {
  AiAgentWebpage,
  AiAgentWebsite,
} from './knowledge/websites/requests/ai-agent-website';

export interface AiAgentStatusSummary {
  total_agents: number;
  connected_agents: number;
  disconnected_agents: number;
  error_agents: number;
  total_requests: number;
  successful_responses: number;
  uptime_percent: number | null;
  average_response_time_ms: number | null;
  token_usage: number;
  last_activity_at: string | null;
  log_count: number;
}

export interface AiAgentStatusAgent {
  id: number;
  group_id: number | null;
  name: string;
  image?: string | null;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  status_detail?: string | null;
  total_requests: number;
  successful_responses: number;
  response_time_ms: number | null;
  uptime_percent: number | null;
  token_usage: number;
  last_activity_at: string | null;
  error_message?: string | null;
  created_at: string | null;
  updated_at: string | null;
  personality?: string | null;
  greeting_type?: string | null;
  initial_flow_id?: number | null;
  basic_greeting_message?: string | null;
  basic_greeting_flow_ids?: number[] | null;
  transfer_instruction?: string | null;
  cant_assist_instruction?: string | null;
}

export interface AiAgentStatusResponse {
  summary: AiAgentStatusSummary;
  agents: AiAgentStatusAgent[];
  refreshed_at: string;
}

function getActiveGroupId(groupId?: number | string | null): number | null {
  if (groupId !== undefined && groupId !== null && `${groupId}` !== '') {
    const parsed = Number(groupId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const value = searchParams.get('groupId');

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAiAgentGroupIdFromUrl(): number | null {
  return getActiveGroupId();
}

function withGroupId<T extends Record<string, string | number>>(params: T, groupId?: number | string | null): T & {groupId?: number} {
  const activeGroupId = getActiveGroupId(groupId);

  return activeGroupId ? {...params, groupId: activeGroupId} : params;
}

export const aiAgentQueries = {
  settings: {
    invalidateKey: ['aiAgent', 'settings'],
    index: (groupId?: number | string | null) => {
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'settings', activeGroupId ?? 'global'],
        queryFn: () =>
          get<{
            settings: AiAgentSettings;
            flows: {id: number; name: string}[];
          }>('lc/ai-agent/settings', withGroupId({}, activeGroupId)),
      });
    },
  },

  status: {
    invalidateKey: ['aiAgent', 'status'],
    index: (groupId?: number | string | null) => {
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'status', activeGroupId ?? 'global'],
        queryFn: () =>
          get<AiAgentStatusResponse>('lc/ai-agent/status', withGroupId({}, activeGroupId)),
      });
    },
  },

  knowledge: {
    invalidateKey: ['aiAgent', 'knowledge'],
    index: (groupId?: number | string | null) =>
      queryOptions({
        queryKey: ['aiAgent', 'knowledge', getActiveGroupId(groupId) ?? 'global'],
        queryFn: () => get<Knowledge>('lc/ai-agent/knowledge', withGroupId({}, groupId)),
      }),
  },

  snippets: {
    invalidateKey: ['aiAgent', 'knowledge'],
    index: (search: Record<string, string>, groupId?: number | string | null) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'knowledge', 'snippets', params, activeGroupId ?? 'global'],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AiAgentSnippet>>(
            'lc/ai-agent/snippets',
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
    get: (snippetId: number | string, groupId?: number | string | null) => {
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'knowledge', 'snippets', snippetId, activeGroupId ?? 'global'],
        queryFn: () =>
          get<{snippet: AiAgentSnippet}>(`lc/ai-agent/snippets/${snippetId}`),
      });
    },
  },

  documents: {
    invalidateKey: ['aiAgent', 'knowledge'],
    index: (search: Record<string, string>, groupId?: number | string | null) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'knowledge', 'documents', params, activeGroupId ?? 'global'],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AiAgentDocument>>(
            'lc/ai-agent/documents',
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
    get: (documentId: number | string, groupId?: number | string | null) =>
      queryOptions({
        queryKey: ['aiAgent', 'knowledge', 'documents', documentId, getActiveGroupId(groupId) ?? 'global'],
        queryFn: () =>
          get<{document: AiAgentDocument}>(
            `lc/ai-agent/documents/${documentId}`,
          ),
      }),
  },

  websites: {
    invalidateKey: ['aiAgent', 'knowledge'],
    index: (search: Record<string, string>, groupId?: number | string | null) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'knowledge', 'websites', params, activeGroupId ?? 'global'],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AiAgentWebsite>>(
            'lc/ai-agent/websites',
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
  },

  webpages: {
    invalidateKey: ['aiAgent', 'knowledge'],
    index: (
      websiteId: number | string,
      search: Record<string, string>,
      groupId?: number | string | null,
    ) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: [
          'aiAgent',
          'knowledge',
          'webpages',
          `${websiteId}`,
          params,
          activeGroupId ?? 'global',
        ],
        queryFn: ({signal}) =>
          get<
            PaginatedBackendResponse<AiAgentWebpage> & {website: AiAgentWebsite}
          >(
            `lc/ai-agent/websites/${websiteId}/webpages`,
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
    get: (
      websiteId: number | string,
      webpageId: number | string,
      groupId?: number | string | null,
    ) => {
      return queryOptions({
        queryKey: [
          'aiAgent',
          'knowledge',
          'webpages',
          `${websiteId}`,
          `${webpageId}`,
          getActiveGroupId(groupId) ?? 'global',
        ],
        queryFn: () =>
          get<{website: AiAgentWebsite; webpage: AiAgentWebpage}>(
            `lc/ai-agent/websites/${websiteId}/webpages/${webpageId}`,
          ),
      });
    },
  },

  flows: {
    invalidateKey: ['aiAgent', 'flows'],
    index: (search: Record<string, string>, groupId?: number | string | null) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'flows', params, activeGroupId ?? 'global'],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AiAgentFlow>>(
            'lc/ai-agent/flows',
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
    list: (groupId?: number | string | null) =>
      queryOptions({
        staleTime: Infinity,
        queryKey: ['aiAgent', 'flows', 'list', getActiveGroupId(groupId) ?? 'global'],
        queryFn: () =>
          get<{flows: {id: number; name: string}[]}>(
            `lc/ai-agent/flows/list`,
            withGroupId({}, groupId),
          ),
      }),
    get: (flowId: number | string, groupId?: number | string | null) => {
      return queryOptions({
        queryKey: ['aiAgent', 'flows', flowId, getActiveGroupId(groupId) ?? 'global'],
        staleTime: Infinity,
        queryFn: () =>
          get<{flow: AiAgentFlow}>(
            `lc/ai-agent/flows/${flowId}`,
            withGroupId({}, groupId),
          ),
      });
    },
    indexAttachments: (flowId: number | string, groupId?: number | string | null) => {
      return queryOptions({
        staleTime: Infinity,
        queryKey: ['aiAgent', 'flows', flowId, 'attachments', getActiveGroupId(groupId) ?? 'global'],
        queryFn: () =>
          get<{attachments: FlowAttachment[]}>(
            `lc/ai-agent/flows/${flowId}/attachments`,
            withGroupId({}, groupId),
          ),
      });
    },
  },

  tools: {
    invalidateKey: ['aiAgent', 'tools'],
    index: (search: Record<string, string>, groupId?: number | string | null) => {
      const params = validateDatatableSearch(search);
      const activeGroupId = getActiveGroupId(groupId);
      return queryOptions({
        queryKey: ['aiAgent', 'tools', 'index', params, activeGroupId ?? 'global'],
        queryFn: ({signal}) =>
          get<PaginatedBackendResponse<AiAgentTool>>(
            'lc/ai-agent/tools',
            withGroupId(params, activeGroupId),
            signal,
          ),
      });
    },
    list: (groupId?: number | string | null) =>
      queryOptions({
        staleTime: Infinity,
        queryKey: ['aiAgent', 'tools', 'list', getActiveGroupId(groupId) ?? 'global'],
        queryFn: () =>
          get<{tools: {id: number; name: string}[]}>(
            `lc/ai-agent/tools/list`,
            withGroupId({}, groupId),
          ),
      }),
    get: (
      toolId: number | string,
      loader?: 'editor' | 'simple',
      groupId?: number | string | null,
    ) =>
      queryOptions({
        queryKey: ['aiAgent', 'tools', toolId, loader, getActiveGroupId(groupId) ?? 'global'],
        staleTime: Infinity,
        queryFn: () =>
          get<{tool: AiAgentTool}>(
            `lc/ai-agent/tools/${toolId}?loader=${loader}`,
            withGroupId({}, groupId),
          ),
      }),
  },
};
