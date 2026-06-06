import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}
export function DetailsList({children, className}: Props) {
  return <div className={clsx('text-sm', className)}>{children}</div>;
}

interface DetailsListItemProps {
  label: ReactNode;
  children: ReactNode;
}
export function DetailsListItem({label, children}: DetailsListItemProps) {
  return (
    <div className="flex items-center py-6">
      <span className="max-w-[50%] flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap text-muted">
        {label}
      </span>
      :{' '}
      <div className="ml-8 overflow-hidden overflow-ellipsis whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
