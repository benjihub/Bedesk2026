import {createContext, RefObject} from 'react';

export interface TabsContext {
  selectedTab: number;
  setSelectedTab: (newTab: number) => void;
  tabsRef: RefObject<HTMLElement[]>;
  size: 'sm' | 'md';
  isLazy?: boolean;
  id: string;
}

export const TabContext = createContext<TabsContext>(null!);
