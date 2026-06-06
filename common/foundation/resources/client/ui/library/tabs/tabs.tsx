import {useControlledState} from '@react-stately/utils';
import {TabListProps} from '@ui/tabs/tab-list';
import {TabPanelsProps} from '@ui/tabs/tab-panels';
import {TabContext, TabsContext} from '@ui/tabs/tabs-context';
import clsx from 'clsx';
import {ReactElement, useId, useMemo, useRef} from 'react';

export interface TabsProps {
  children:
    | [ReactElement<TabListProps>, ReactElement<TabPanelsProps>]
    | ReactElement<TabListProps>;
  size?: 'sm' | 'md';
  className?: string;
  selectedTab?: number;
  defaultSelectedTab?: number;
  onTabChange?: (newTab: number) => void;
  isLazy?: boolean;
  overflow?: string;
}

export function Tabs(props: TabsProps) {
  const {
    size = 'md',
    children,
    className,
    isLazy,
    overflow = 'overflow-hidden',
  } = props;

  const tabsRef = useRef<HTMLButtonElement[]>([]);
  const id = useId();

  const [selectedTab, setSelectedTab] = useControlledState(
    props.selectedTab,
    props.defaultSelectedTab || 0,
    props.onTabChange,
  );

  const ContextValue: TabsContext = useMemo(() => {
    return {
      selectedTab,
      setSelectedTab,
      tabsRef,
      size,
      isLazy,
      id,
    };
  }, [selectedTab, id, isLazy, setSelectedTab, size]);

  return (
    <TabContext.Provider value={ContextValue}>
      <div className={clsx(className, overflow, 'max-w-full flex-shrink-0')}>
        {children}
      </div>
    </TabContext.Provider>
  );
}
