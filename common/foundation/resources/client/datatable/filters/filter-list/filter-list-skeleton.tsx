import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Skeleton} from '@ui/skeleton/skeleton';
import {m} from 'framer-motion';

const widths = ['w-90', 'w-76', 'w-128'];

interface Props {
  count?: number;
}
export function FilterListSkeleton({count}: Props) {
  return (
    <m.div
      className="flex h-30 items-center gap-6"
      key="filter-list-skeleton"
      {...opacityAnimation}
    >
      {Array.from({length: count || 3}).map((_, index) => (
        <Skeleton
          key={index}
          variant="rect"
          size={`h-full ${widths[index % widths.length]}`}
          radius="rounded-md"
        />
      ))}
    </m.div>
  );
}
