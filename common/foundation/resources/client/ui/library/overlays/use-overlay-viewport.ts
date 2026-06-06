import {rootEl} from '@ui/root-el';
import {observeSize} from '@ui/utils/dom/observe-size';
import {useEffect, useState} from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

export function useOverlayViewport(): Record<string, string> {
  // if root el is not body, we are inside iframe or another
  // element and should use that element as a viewport instead
  const [rootElIsBody] = useState(() => rootEl === document.body);
  const [size, setSize] = useState(() => getViewportSize(rootElIsBody));

  useEffect(() => {
    const onResize = () => {
      setSize(size => {
        const newSize = getViewportSize(rootElIsBody);
        if (newSize.width === size.width && newSize.height === size.height) {
          return size;
        }
        return newSize;
      });
    };

    if (!rootElIsBody) {
      return observeSize({current: rootEl}, onResize);
    } else {
      const obj = visualViewport || window;
      obj.addEventListener('resize', onResize);
      return () => obj.removeEventListener('resize', onResize);
    }
  }, [rootElIsBody]);

  return {
    '--be-viewport-height': `${size.height}px`,
    '--be-viewport-width': `${size.width}px`,
  };
}

function getViewportSize(rootElIsBody: boolean): ViewportSize {
  const visualViewport = window.visualViewport;
  return {
    width: (rootElIsBody && visualViewport?.width) || rootEl.clientWidth,
    height: (rootElIsBody && visualViewport?.height) || rootEl.clientHeight,
  };
}
