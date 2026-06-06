import {useLayoutEffect} from '@react-aria/utils';
import {TabContext} from '@ui/tabs/tabs-context';
import clsx from 'clsx';
import {useContext, useRef, useState} from 'react';

interface TabLineStyle {
  width?: string;
  transform?: string;
  className?: string;
}

export function TabLine() {
  const {tabsRef, selectedTab} = useContext(TabContext);
  const positionRef = useRef(-1);
  const [style, setStyle] = useState<TabLineStyle>({
    width: undefined,
    transform: undefined,
    className: undefined,
  });

  useLayoutEffect(() => {
    if (
      selectedTab != null &&
      tabsRef.current &&
      selectedTab !== positionRef.current
    ) {
      const el = tabsRef.current[selectedTab];
      if (!el) return;

      setStyle(prevState => {
        return {
          width: `${el.offsetWidth}px`,
          transform: `translateX(${el.offsetLeft}px)`,
          // disable initial transition for tabline
          className: prevState.width === undefined ? '' : 'transition-all',
        };
      });
      positionRef.current = selectedTab;
    }
  }, [setStyle, selectedTab, tabsRef]);

  return (
    <div
      className={clsx(
        'absolute bottom-0 left-0 h-2 bg-primary',
        style.className,
      )}
      role="presentation"
      style={{width: style.width, transform: style.transform}}
    />
  );
}
