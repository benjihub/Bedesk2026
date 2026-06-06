import {ReactNode} from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children?: ReactNode;
  className?: string;
  withBorder?: boolean;
  top?: string;
  right?: string;
  color?: string;
}
export function Badge({
  children,
  className,
  withBorder = true,
  top = 'top-2',
  right = 'right-4',
  color = 'bg-warning text-white',
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'absolute flex items-center justify-center whitespace-nowrap rounded-full text-[11px] font-bold shadow',
        withBorder && 'border-2 border-white',
        color,
        children ? 'w-max p-4 leading-[0.6]' : 'h-12 w-12',
        className,
        top,
        right,
      )}
    >
      {children}
    </span>
  );
}
