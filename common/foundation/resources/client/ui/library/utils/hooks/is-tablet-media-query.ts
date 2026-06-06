import {useMediaQuery} from '@ui/utils/hooks/use-media-query';

export function useIsTabletMediaQuery() {
  return useMediaQuery('(max-width: 1024px)');
}
