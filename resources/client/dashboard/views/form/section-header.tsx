import {ReactNode} from 'react';

export interface Props {
  children: ReactNode;
  description?: ReactNode;
}
export function SectionHeader({children, description}: Props) {
  return (
    <div className="mb-24 mt-64">
      <div className="text-lg">{children}</div>
      {description && <div className="text-sm text-muted">{description}</div>}
    </div>
  );
}
