import {usePlayerStore} from '@common/player/hooks/use-player-store';

export function useIsMediaCued(mediaId: string | number): boolean {
  const cuedMediaId = usePlayerStore(s => s.cuedMedia?.id);
  return cuedMediaId === mediaId;
}
