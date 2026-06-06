import {useFocusManager} from '@react-aria/focus';
import {TabContext} from '@ui/tabs/tabs-context';
import clsx from 'clsx';
import React, {JSXElementConstructor, ReactNode, useContext} from 'react';
import {Link, LinkProps} from 'react-router';

export interface TabProps {
  className?: string;
  index?: number;
  children: ReactNode;
  isDisabled?: boolean;
  padding?: string;
  elementType?: 'button' | 'a' | JSXElementConstructor<any>;
  to?: LinkProps['to'];
  relative?: LinkProps['relative'];
  replace?: LinkProps['replace'];
  width?: string;
  height?: string;
}
export function Tab({
  index,
  className,
  isDisabled,
  children,
  padding: paddingProp,
  elementType,
  to,
  relative,
  width = 'min-w-min',
  height,
}: TabProps) {
  const {
    selectedTab,
    setSelectedTab,
    tabsRef,
    size = 'md',
    id,
  } = useContext(TabContext);
  const isSelected = index === selectedTab;
  const focusManager = useFocusManager();
  const padding = paddingProp || (size === 'sm' ? 'px-12' : 'px-18');

  const mergedClassname = clsx(
    'tracking-wide overflow-hidden capitalize text-sm flex items-center justify-center outline-none transition-colors',
    'focus-visible:ring focus-visible:ring-2 ring-inset rounded whitespace-nowrap cursor-pointer',
    width,
    textColor({isDisabled, isSelected}),
    className,
    size === 'md' && `${padding} ${height || 'h-48'}`,
    size === 'sm' && `${padding} ${height || 'h-32'}`,
    isDisabled && 'pointer-events-none',
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowLeft':
        focusManager?.focusPrevious();
        break;
      case 'ArrowRight':
        focusManager?.focusNext();
        break;
      case 'Home':
        focusManager?.focusFirst();
        break;
      case 'End':
        focusManager?.focusLast();
        break;
    }
  };

  const tabIndex = isSelected ? 0 : -1;
  const Element = to ? Link : (elementType ?? 'button');

  return (
    <Element
      disabled={isDisabled}
      id={`${id}-${index}-tab`}
      aria-controls={`${id}-${index}-tabpanel`}
      type="button"
      role="tab"
      aria-selected={isSelected}
      tabIndex={isDisabled ? undefined : tabIndex}
      onKeyDown={onKeyDown}
      onClick={() => {
        setSelectedTab(index!);
      }}
      to={to}
      relative={relative}
      className={mergedClassname}
      ref={(el: HTMLElement) => {
        if (tabsRef.current && el) {
          tabsRef.current[index!] = el;
        }
      }}
    >
      {children}
    </Element>
  );
}

interface TextColorProps {
  isDisabled?: boolean;
  isSelected: boolean;
}
function textColor({isDisabled, isSelected}: TextColorProps): string {
  if (isDisabled) {
    return 'text-disabled cursor-default';
  }
  if (isSelected) {
    return 'text-primary';
  }
  return 'text-muted hover:text-main';
}
