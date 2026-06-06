import {useMediaQuery} from '@ui/utils/hooks/use-media-query';

export function useIsMobileMediaQuery() {
  return useMediaQuery('(max-width: 768px)');
}
