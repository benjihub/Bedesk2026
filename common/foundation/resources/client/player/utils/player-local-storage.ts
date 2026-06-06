import {MediaItem} from '@common/player/media-item';
import {PlayerState} from '@common/player/state/player-state';
import {PlayerStoreOptions} from '@common/player/state/player-store-options';
import {getFromLocalStorage} from '@ui/utils/hooks/local-storage';

export interface PersistablePlayerState {
  muted?: PlayerState['muted'];
  repeat?: PlayerState['repeat'];
  shuffling?: PlayerState['shuffling'];
  volume?: PlayerState['volume'];
}

export interface PlayerInitialData {
  state?: PersistablePlayerState | null;
  queue?: PlayerState['originalQueue'] | null;
  cuedMediaId?: string | number | null;
}

export function getPlayerStateFromLocalStorage(
  id: string | number,
  options?: PlayerStoreOptions,
): PlayerInitialData {
  const defaultVolume = options?.defaultVolume || 30;
  return {
    state: {
      muted: getFromLocalStorage(`player.${id}.muted`) ?? false,
      repeat: getFromLocalStorage(`player.${id}.repeat`) ?? 'all',
      shuffling: getFromLocalStorage(`player.${id}.shuffling`) ?? false,
      volume: getFromLocalStorage(`player.${id}.volume`) ?? defaultVolume,
    },
    queue: getFromLocalStorage<MediaItem[]>(`player.${id}.queue`, []),
    cuedMediaId: getFromLocalStorage<string>(`player.${id}.cuedMediaId`),
  };
}
