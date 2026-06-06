import React, {ReactNode} from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  margin?: string;
}
export function CrupdateGroupSectionHeader({
  children,
  margin = 'mb-16',
}: Props) {
  return (
    <div className={clsx(margin, 'text-base font-semibold')}>{children}</div>
  );
}
