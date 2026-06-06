import { getCustomEchoAuthEndpoint } from '@common/http/echo-custom-auth-endpoint';
import { setEchoSocketId } from '@common/http/get-echo-socket-id';
import { getBootstrapData } from '@ui/bootstrap-data/bootstrap-data-store';
import EchoType, { EchoOptions } from 'laravel-echo';

let globalEcho: Promise<EchoType<'reverb'>> | null = null;

export async function bootEcho() {
  if (globalEcho) return await globalEcho;

  globalEcho = new Promise(async (resolve, reject) => {
    const config = getBootstrapData().settings.broadcasting;
    if (!config || config.driver === 'log' || config.driver === 'null') {
      // Prevent a forever-pending promise which would permanently disable
      // websocket listeners (especially in widget boot flows).
      globalEcho = null;
      reject(new Error('Websockets are not configured.'));
      return;
    }

    // Reverb connector in laravel-echo relies on pusher-js being available.
    let Echo: any;
    if (config.driver === 'reverb') {
      const [{default: ImportedEcho}, {default: Pusher}] = await Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
      ]);
      Echo = ImportedEcho;
      if (!(globalThis as any).Pusher) {
        (globalThis as any).Pusher = Pusher;
      }
    }

    const echoInstance = new Echo({
      ...getCredentials(config),
      authEndpoint: getCustomEchoAuthEndpoint() ?? 'broadcasting/auth',
      csrfToken: getBootstrapData().csrf_token,
    });

    // Reverb connection
    if (config.driver === 'reverb' && 'reverb' in echoInstance.connector) {
      echoInstance.connector.reverb.connection.bind('connected', (e: any) => {
        setEchoSocketId(e.socket_id);
        resolve(echoInstance as EchoType<'reverb'>);
      });

      echoInstance.connector.reverb.connection.bind('error', (err: any) => {
        console.error('Reverb connection error:', err);
        globalEcho = null;
        reject(err);
      });
    } else {
      // fallback
      resolve(echoInstance as EchoType<'reverb'>);
    }
  });

  return globalEcho;
}

function getCredentials(config: any): EchoOptions<'reverb'> {
  if (config.driver === 'reverb') {
    const scheme = config.scheme ?? 'https';
    const isLocalhost = config.host === '127.0.0.1' || config.host === 'localhost';
    const forceTLS = scheme === 'https' && !isLocalhost;
    const enabledTransports = forceTLS ? ['wss', 'ws'] : ['ws'];

    return {
      broadcaster: 'reverb',
      key: config.key,
      wsHost: config.host,
      wsPort: config.port,
      wssPort: config.port,
      forceTLS,
      enabledTransports,
    } as EchoOptions<'reverb'>;
  }

  throw new Error(`Unsupported broadcasting driver: ${config.driver}`);
}
