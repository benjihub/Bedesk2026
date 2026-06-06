import clsx from 'clsx';
import {ReactNode, Ref} from 'react';

export interface ChartLayoutProps {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
  contentIsFlex?: boolean;
  contentClassName?: string;
  contentRef?: Ref<HTMLDivElement>;
  isLoading?: boolean;
}
export function ChartLayout(props: ChartLayoutProps) {
  const {
    title,
    description,
    children,
    className,
    contentIsFlex = true,
    contentClassName,
    contentRef,
  } = props;

  return (
    <div
      className={clsx(
        'flex flex-auto flex-col rounded-panel border bg-elevated p-20',
        className,
      )}
    >
      <div className="flex flex-shrink-0 items-center justify-between pb-10 text-xs">
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="text-muted">{description}</div>}
      </div>
      <div
        ref={contentRef}
        className={clsx(
          'relative',
          contentIsFlex && 'flex flex-auto items-center justify-center',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
