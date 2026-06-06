import {cloneElement, ReactElement} from 'react';
import clsx from 'clsx';

interface DashboardContentProps {
  children: ReactElement<{className: string}>;
  isScrollable?: boolean;
  stableScrollbar?: boolean;
}
export function DashboardContent({
  children,
  isScrollable = true,
  stableScrollbar = true,
}: DashboardContentProps) {
  return cloneElement(children, {
    className: clsx(
      children.props.className,
      isScrollable && 'overflow-y-auto',
      isScrollable && stableScrollbar && 'stable-scrollbar',
      'dashboard-grid-content',
      'has-[.dashboard-stable-scrollbar]:stable-scrollbar',
    ),
  });
}
