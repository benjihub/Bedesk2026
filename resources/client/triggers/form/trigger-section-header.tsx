import {ReactNode} from 'react';

interface Props {
  children: ReactNode;
}
export function TriggerSectionHeader({children}: Props) {
  return <h2 className="border-b pb-8 text-sm font-bold">{children}</h2>;
}
