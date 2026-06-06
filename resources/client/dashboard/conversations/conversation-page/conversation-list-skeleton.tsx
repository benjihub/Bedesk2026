import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Skeleton} from '@ui/skeleton/skeleton';
import {m} from 'framer-motion';

interface Props {
  count?: number;
}
export function ConversationListSkeleton({count = 3}: Props) {
  return (
    <m.div key="chat-list-skeletons" {...opacityAnimation}>
      {Array.from({length: count}).map((_, index) => (
        <Item key={index} />
      ))}
    </m.div>
  );
}

function Item() {
  return (
    <div className="flex gap-8 p-12">
      <Skeleton
        variant="avatar"
        radius="rounded-full"
        size="w-24 h-24"
        animation="wave"
      />
      <div className="flex-auto">
        <div className="mb-4 text-base font-semibold">
          <Skeleton className="max-w-80" animation="wave" />
        </div>
        <div className="text-[13px]">
          <Skeleton className="max-w-280" animation="wave" />
          <Skeleton className="max-w-200" animation="wave" />
        </div>
      </div>
    </div>
  );
}
