import {ReactNode} from 'react';
import {Skeleton} from '@ui/skeleton/skeleton';

interface Props {
  name: ReactNode;
  description?: ReactNode;
  information?: ReactNode;
}
export function HelpScreenHeader({name, description, information}: Props) {
  return (
    <div className="border-b-lighter border-b px-20 py-16">
      <div className="text-base font-semibold">{name}</div>
      {description && <div className="mt-4 text-sm">{description}</div>}
      {information && (
        <div className="mt-4 text-sm text-muted">{information}</div>
      )}
    </div>
  );
}

export function HelpScreenHeaderSkeleton() {
  return (
    <HelpScreenHeader
      name={<Skeleton size="w-240" />}
      information={<Skeleton size="w-68" />}
    />
  );
}
