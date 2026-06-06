import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import EchoType, {EchoOptions} from 'laravel-echo';
import {setEchoSocketId} from '@common/http/get-echo-socket-id';
import {getApiClientGlobalHeaders} from '@common/http/query-client';

let customAuthEndpoint: string | undefined;

export function setCustomEchoAuthEndpoint(endpoint: string) {
  customAuthEndpoint = endpoint;
}

export function getCustomEchoAuthEndpoint() {
  return customAuthEndpoint;
}

let globalEcho: Promise<EchoType<'reverb' | 'pusher'>> | null = null;

export async function bootEcho() {
  // deduplicate requests from different components
  if (globalEcho) {
    return await globalEcho;
  }

  globalEcho = new Promise(async (resolve, reject) => {
    const config = getBootstrapData().settings.broadcasting;
    if (!config || config.driver === 'log' || config.driver === 'null') {
      return;
    }

    const [{default: Echo}, {default: Pusher}] = await Promise.all([
      import('laravel-echo'),
      import('pusher-js'),
    ]);

    // Echo's Pusher connector expects a globally available Pusher constructor
    // unless provided via the "client" option.
    if (!(globalThis as any).Pusher) {
      (globalThis as any).Pusher = Pusher;
    }

    const echoInstance = new Echo({
      ...getCredentials(config),
      broadcaster: config.driver === 'reverb' ? 'reverb' : 'pusher',
      // ensure pusher-js is available even in module-bundled environments
      client: config.driver === 'pusher' ? (Pusher as any) : undefined,
      authEndpoint: getCustomEchoAuthEndpoint() ?? 'broadcasting/auth',
      csrfToken: getBootstrapData().csrf_token,
      // for pusher driver, make sure auth requests include the same
      // global headers used by apiClient (X-Widget-Auth, X-Chat-Widget, etc.)
      auth:
        config.driver === 'pusher'
          ? {
              headers: {
                'X-CSRF-TOKEN': getBootstrapData().csrf_token,
                ...getApiClientGlobalHeaders(),
              },
            }
          : undefined,
    });

    if ('pusher' in echoInstance.connector) {
      echoInstance.connector.pusher.connection.bind(
        'connected',
        function (e: any) {
          setEchoSocketId(e.socket_id);
          resolve(echoInstance as EchoType<'pusher' | 'reverb'>);
        },
      );
    } else if ('reverb' in echoInstance.connector) {
      echoInstance.connector.reverb.connection.bind(
        'connected',
        function (e: any) {
          setEchoSocketId(e.socket_id);
          resolve(echoInstance as EchoType<'pusher' | 'reverb'>);
        },
      );
    }
  });

  return globalEcho;
}

function getCredentials(config: any): EchoOptions<'reverb'> {
  switch (config?.driver) {
    case 'pusher':
      return {
        broadcaster: 'pusher',
        key: config.key,
        cluster: config.cluster,
        encrypted: config.encrypted,
        host: config.host,
        port: config.port,
        scheme: config.scheme,
        useTLS: config.useTLS,
        authEndpoint: config.authEndpoint,
        csrfToken: getBootstrapData().csrf_token,
        auth: {
          headers: {
            'X-CSRF-TOKEN': getBootstrapData().csrf_token,
            ...getApiClientGlobalHeaders(),
          },
        },
      };
    case 'reverb':
      return {
        broadcaster: 'reverb',
        key: config.key,
        host: config.host,
        port: config.port,
        scheme: config.scheme,
        authorizer: (channel, options) => {
          return {
            authorize: (socketId, callback) => {
              options.auth = {
                headers: {
                  'X-CSRF-TOKEN': getBootstrapData().csrf_token,
                  ...getApiClientGlobalHeaders(),
                },
              };
              options.params = {
                ...options.params,
                socket_id: socketId,
                channel_name: channel.name,
              };
              fetch(options.authEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...options.auth.headers,
                },
                body: JSON.stringify(options.params),
              })
                .then(response => response.json())
                .then(data => {
                  callback(false, data);
                })
                .catch(error => {
                  callback(true, error);
                });
            },
          };
        },
      };
    default:
      return {};
  }
}
