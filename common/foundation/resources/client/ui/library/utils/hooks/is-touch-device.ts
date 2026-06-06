import {useMediaQuery} from '@ui/utils/hooks/use-media-query';

export function useIsTouchDevice() {
  return useMediaQuery('((pointer: coarse))');
}
