import {apiClient} from '@common/http/query-client';
import {useAuth} from '@common/auth/use-auth';
import {useEffect, useRef} from 'react';

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useAgentPresenceKeepAlive() {
  const {user} = useAuth();
  const intervalRef = useRef<number | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    if (!user?.id) {
      return () => {
        abortRef.current = true;
      };
    }

    const beaconUrl = `${window.location.origin}/api/v1/user-sessions/heartbeat`;

    const sendHeartbeat = () => {
      if (abortRef.current) return;

      if (document.visibilityState !== 'visible' && navigator?.sendBeacon) {
        try {
          const blob = new Blob([
            JSON.stringify({timestamp: Date.now()}),
          ], {type: 'application/json'});
          navigator.sendBeacon(beaconUrl, blob);
          return;
        } catch (error) {
          // fallback to fetch if sendBeacon fails
        }
      }

      apiClient
        .post('user-sessions/heartbeat', {})
        .catch(() => {
          // suppress network errors to avoid noise in app
        });
    };

    const resetInterval = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(
        sendHeartbeat,
        HEARTBEAT_INTERVAL_MS,
      );
    };

    const handleVisibilityChange = () => {
      sendHeartbeat();
      resetInterval();
    };

    const handleWindowFocus = () => {
      sendHeartbeat();
      resetInterval();
    };

    sendHeartbeat();
    resetInterval();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      abortRef.current = true;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user?.id]);
}
