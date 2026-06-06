import {useEffect, useState} from 'react';

export function useMediaQuery(query: string) {
  const supportsMatchMedia =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState(() =>
    supportsMatchMedia ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!supportsMatchMedia) {
      return;
    }

    const mq = window.matchMedia(query);
    const onChange = () => {
      setMatches(mq.matches);
    };

    mq.addEventListener('change', onChange);
    onChange();

    return () => {
      mq.removeEventListener('change', onChange);
    };
  }, [supportsMatchMedia, query]);

  return typeof window === 'undefined' ? null : matches;
}
