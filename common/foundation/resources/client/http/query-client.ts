import {getSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {errorStatusIs} from '@common/http/error-status-is';
import {getEchoSocketId} from '@common/http/get-echo-socket-id';
import {QueryClient} from '@tanstack/react-query';
import {isAbsoluteUrl} from '@ui/utils/urls/is-absolute-url';
import axios, {AxiosRequestConfig} from 'axios';
import {getActiveWorkspaceId} from '../workspace/active-workspace-id';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (failureCount, err) => {
        return (
          !errorStatusIs(err, 401) &&
          !errorStatusIs(err, 403) &&
          !errorStatusIs(err, 404) &&
          failureCount < 2
        );
      },
    },
  },
});

const globalHeaders: Record<string, string> = {};
export function addGlobalHeaderToApiClient(header: string, value: string) {
  globalHeaders[header.trim()] = value.trim();
}
export function getApiClientGlobalHeaders() {
  return globalHeaders;
}

export const apiClient = axios.create();
apiClient.defaults.withCredentials = true;
apiClient.defaults.responseType = 'json';
// @ts-ignore
apiClient.defaults.headers = {
  common: {
    Accept: 'application/json',
  },
};

const internalEndpoints = ['auth', 'secure', 'log-viewer', 'horizon'];
// @ts-ignore
apiClient.interceptors.request.use((config: AxiosRequestConfig) => {
  if (
    !internalEndpoints.some(endpoint => config.url?.startsWith(endpoint)) &&
    !isAbsoluteUrl(config?.url)
  ) {
    config.url = `api/v1/${config.url}`;
  }

  const method = config.method?.toUpperCase();

  // transform array query params in GET request to comma separated string
  if (method === 'GET' && Array.isArray(config.params?.with)) {
    config.params.with = config.params.with.join(',');
  }
  if (method === 'GET' && Array.isArray(config.params?.load)) {
    config.params.load = config.params.load.join(',');
  }
  if (method === 'GET' && Array.isArray(config.params?.loadCount)) {
    config.params.loadCount = config.params.loadCount.join(',');
  }

  // add workspace query parameter
  const workspaceId = getActiveWorkspaceId();
  if (workspaceId) {
    const method = config.method?.toLowerCase();
    if (
      ['get', 'post', 'put', 'delete'].includes(method!) &&
      config.params?.workspaceId == null
    ) {
      config.params = {...config.params, workspaceId};
    }
  }

  Object.entries(globalHeaders).forEach(([key, value]) => {
    config.headers = {
      ...config.headers,
      [key]: value,
    };
  });

  const echoSocketId = getEchoSocketId();
  if (echoSocketId) {
    config.headers = {
      ...config.headers,
      // @ts-ignore
      'X-Socket-ID': echoSocketId,
    };
  }

  const settingsPreviewMode = getSettingsPreviewMode();
  if (settingsPreviewMode.isInsideSettingsPreview) {
    config.headers = {
      ...config.headers,
      'X-Settings-Preview': 'true',
    };
  }

  // override PUT, DELETE, PATCH methods, they might not be supported on the backend
  if (method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
    config.headers = {
      ...config.headers,
      'X-HTTP-Method-Override': method,
    };
    config.method = 'POST';
    config.params = {
      ...config.params,
      _method: method,
    };
  }

  return config;
});
