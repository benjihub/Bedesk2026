import clsx from 'clsx';
import {forwardRef, HTMLAttributes, ReactNode, Ref} from 'react';

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  className?: string;
  children: ReactNode;
  color: 'primary' | 'chip' | 'note';
  allowBreak?: boolean;
  onClick?: () => void;
}
export const FeedBubble = forwardRef(function FeedBubble(
  {className, children, color, allowBreak, onClick, ...rest}: Props,
  ref: Ref<HTMLDivElement>,
) {
  return (
    <div
      {...rest}
      ref={ref}
      onClick={onClick}
      className={clsx(
        'w-max max-w-full rounded-[18px] px-16 py-12 text-[13px] leading-[1.4]',
        getColor(color),
        allowBreak
          ? 'break-words'
          : 'overflow-hidden overflow-ellipsis whitespace-nowrap',
        className,
      )}
    >
      {children}
    </div>
  );
});

export function getColor(color: 'primary' | 'chip' | 'note') {
  switch (color) {
    case 'primary':
      return 'bg-primary/20 dark:bg-primary dark:text-on-primary';
    case 'chip':
      return 'bg-chip/70';
    case 'note':
      return 'bg-note dark:bg-[#45380c]';
  }
}
