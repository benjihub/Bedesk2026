import {ReactNode} from 'react';

interface Props {
  children: ReactNode;
}
export function FloatingNodeName({children}: Props) {
  return (
    <div className="absolute -top-34 left-1/2 w-max -translate-x-1/2 whitespace-nowrap bg-alt/70 p-8 text-sm font-semibold text-muted">
      {children}
    </div>
  );
}
