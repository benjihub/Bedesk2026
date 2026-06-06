import {usePlayerActions} from '@common/player/hooks/use-player-actions';
import {usePlayerStore} from '@common/player/hooks/use-player-store';
import {useEffect, useRef, useState} from 'react';

interface Props {
  precision: 'ms' | 'seconds';
  disabled?: boolean;
}
export function useCurrentTime(
  {precision, disabled}: Props = {precision: 'ms', disabled: false},
) {
  const timeRef = useRef(0);
  const {subscribe, getCurrentTime} = usePlayerActions();
  const providerName = usePlayerStore(s => s.providerName);
  const cuedMediaId = usePlayerStore(s => s.cuedMedia?.id);
  const providerKey =
    providerName && cuedMediaId ? `${providerName}+${cuedMediaId}` : null;

  const [currentTime, setCurrentTime] = useState(() => getCurrentTime());

  useEffect(() => {
    let unsubscribe: () => void;
    if (!disabled) {
      unsubscribe = subscribe({
        progress: ({currentTime}) => {
          const time =
            precision === 'ms' ? currentTime : Math.floor(currentTime);
          if (timeRef.current !== time) {
            setCurrentTime(time);
            timeRef.current = time;
          }
        },
      });
    }
    return () => unsubscribe?.();
  }, [precision, subscribe, disabled]);

  // update current time when media or provider changes
  useEffect(() => {
    if (providerKey) {
      setCurrentTime(getCurrentTime());
    }
  }, [providerKey, getCurrentTime]);

  return currentTime;
}
