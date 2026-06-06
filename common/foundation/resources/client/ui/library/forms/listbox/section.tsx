import clsx from 'clsx';
import React, {ReactNode, useId} from 'react';

export interface ListboxSectionProps {
  label?: ReactNode;
  children: React.ReactNode;
  index?: number;
}
export function Section({children, label, index}: ListboxSectionProps) {
  const id = useId();

  return (
    <div
      role="group"
      className={clsx(index !== 0 && 'my-4 border-t')}
      aria-labelledby={label ? `be-select-${id}` : undefined}
    >
      {label && (
        <div
          className="block px-16 py-10 text-xs uppercase text-muted"
          role="presentation"
          id={`be-select-${id}`}
          aria-hidden="true"
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
