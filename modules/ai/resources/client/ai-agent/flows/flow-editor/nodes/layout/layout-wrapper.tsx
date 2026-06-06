import clsx from 'clsx';
import {HTMLAttributes, ReactNode} from 'react';

type NewType = HTMLAttributes<HTMLDivElement>;

interface Props extends NewType {
  children: ReactNode;
  className?: string;
}
export function LayoutWrapper({children, className, ...other}: Props) {
  return (
    <div
      {...other}
      className={clsx(
        'before:absolute before:-left-40 before:-top-40 before:-z-10 before:block before:h-[calc(100%+80px)] before:w-[calc(100%+80px)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
