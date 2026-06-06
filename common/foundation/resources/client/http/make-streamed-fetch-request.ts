import {getEchoSocketId} from '@common/http/get-echo-socket-id';
import {getApiClientGlobalHeaders} from '@common/http/query-client';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export function makeStreamedFetchRequest(
  url: string,
  payload?: unknown,
  signal?: AbortSignal,
) {
  const headers: Record<string, string> = {
    ...getApiClientGlobalHeaders(),
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': getBootstrapData().csrf_token,
  };

  const echoSocketId = getEchoSocketId();
  if (typeof echoSocketId === 'string') {
    headers['X-Socket-ID'] = echoSocketId;
  }

  return fetch(`${getBootstrapData().settings.base_url}/api/v1/${url}`, {
    method: 'POST',
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
    signal,
  });
}
