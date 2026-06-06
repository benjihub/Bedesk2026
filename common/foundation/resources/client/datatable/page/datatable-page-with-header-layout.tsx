import {ToggleDashboardSidebarButton} from '@common/datatable/page/toggle-dashboard-sidebar-button';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface DatatablePageWithHeaderLayoutProps {
  children: ReactNode;
  className?: string;
}
export function DatatablePageWithHeaderLayout({
  children,
  className,
}: DatatablePageWithHeaderLayoutProps) {
  return (
    <div className={clsx('flex h-full flex-col', className)}>{children}</div>
  );
}

export function DatatablePageScrollContainer({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex-auto overflow-y-auto">{children}</div>;
}

export type BodyProps = {
  children: ReactNode;
};
export function DatatablePageWithHeaderBody({children}: BodyProps) {
  return (
    <div className="flex min-h-0 flex-auto flex-col p-12 md:p-24">
      {children}
    </div>
  );
}

interface DatatablePageHeaderBarProps {
  title?: ReactNode;
  children?: ReactNode;
  showSidebarToggleButton?: boolean;
  titleId?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  border?: string;
  padding?: string;
  className?: string;
  toggleButton?: ReactNode;
}
export function DatatablePageHeaderBar({
  title,
  children,
  showSidebarToggleButton = false,
  titleId,
  leftContent,
  rightContent,
  border = 'border-b',
  padding,
  className,
  toggleButton,
}: DatatablePageHeaderBarProps) {
  if (!toggleButton) {
    toggleButton = showSidebarToggleButton ? (
      <ToggleDashboardSidebarButton />
    ) : null;
  }

  const titleContent = title || children;

  return (
    <div
      className={clsx(
        'flex h-56 flex-shrink-0 items-center gap-8',
        padding
          ? padding
          : showSidebarToggleButton
            ? 'pl-8 pr-12 md:pl-20 md:pr-24'
            : 'px-12 md:px-24',
        border,
        className,
      )}
    >
      {toggleButton}
      {titleContent && (
        <h1
          id={titleId}
          className={clsx(
            'mr-24 flex-auto overflow-hidden overflow-ellipsis whitespace-nowrap text-xl font-semibold first:capitalize [&_.breadcrumb-root]:-ml-6',
          )}
        >
          {titleContent}
        </h1>
      )}
      {leftContent}
      {rightContent && (
        <div className="ml-auto flex items-center gap-8">{rightContent}</div>
      )}
    </div>
  );
}
