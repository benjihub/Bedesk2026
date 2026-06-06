import clsx from 'clsx';
import {HTMLAttributes, ReactNode} from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showSeparator?: boolean;
  gap?: string;
  className?: string;
  padding?: string;
  fontSize?: string;
}
export function InboxSectionHeader({
  children,
  showSeparator = true,
  gap = 'gap-0',
  className,
  padding = 'px-12 lg:px-16',
  fontSize = 'text-lg font-semibold',
  ...rest
}: Props) {
  return (
    <div
      {...rest}
      className={clsx(
        'flex h-56 flex-shrink-0 items-center',
        showSeparator && 'border-b',
        gap,
        padding,
        className,
        fontSize,
      )}
    >
      {children}
    </div>
  );
}
