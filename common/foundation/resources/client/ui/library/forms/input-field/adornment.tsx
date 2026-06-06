import clsx from 'clsx';
import React from 'react';

type AdornmentProps = {
  children: React.ReactNode;
  direction: 'start' | 'end';
  position?: string;
  className?: string;
};
export function Adornment({
  children,
  direction,
  className,
  position = direction === 'start' ? 'left-4' : 'right-0',
}: AdornmentProps) {
  if (!children) return null;
  return (
    <div
      className={clsx(
        !(children as any)?.props?.onClick && 'pointer-events-none',
        'absolute top-0 z-10 flex h-full min-w-42 items-center justify-center text-muted',
        position,
        className,
      )}
    >
      {children}
    </div>
  );
}
