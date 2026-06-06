import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}
export function HomeScreenCardLayout({children, className}: Props) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-panel border bg-elevated text-sm shadow',
        className,
      )}
    >
      {children}
    </div>
  );
}
