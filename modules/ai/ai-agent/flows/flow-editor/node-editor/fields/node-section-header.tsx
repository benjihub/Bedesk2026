import {Children, ReactNode} from 'react';

interface Props {
  children: [ReactNode, ReactNode];
}
export function NodeSectionHeader({children}: Props) {
  const [title, description] = Children.toArray(children);
  return (
    <div>
      {title ? <div className="text-sm">{title}</div> : null}
      {description ? (
        <div className="mb-14 text-xs text-muted">{description}</div>
      ) : null}
    </div>
  );
}
