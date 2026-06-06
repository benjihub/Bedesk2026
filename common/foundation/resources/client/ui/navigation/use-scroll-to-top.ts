import { getScrollParent } from '@react-aria/utils';
import { usePrevious } from '@ui/utils/hooks/use-previous';
import { RefObject, useEffect } from 'react';
import { useLocation } from 'react-router';

export function useScrollToTop(ref?: RefObject<HTMLElement>) {
  const {pathname} = useLocation();

  const previousPathname = usePrevious(pathname);

  useEffect(() => {
    if (previousPathname !== pathname) {
      scrollToTop(ref);
    }
  }, [pathname, previousPathname, ref]);
}

export function scrollToTop(ref?: RefObject<HTMLElement | null>) {
  const scrollParent = ref?.current
    ? getScrollParent(ref.current)
    : document.documentElement;
  scrollParent.scrollTo({
    top: 0,
    left: 0,
  });
}
