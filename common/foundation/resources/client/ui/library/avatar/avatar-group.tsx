import {AvatarProps} from '@ui/avatar/avatar';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {Children, ReactElement, ReactNode} from 'react';
import {Link} from 'react-router';

interface AvatarGroupProps {
  children: ReactNode;
  className?: string;
  showMore?: boolean;
}
export function AvatarGroup({
  children: propsChildren,
  showMore = true,
  className,
}: AvatarGroupProps) {
  const children = Children.toArray(
    propsChildren,
  ) as ReactElement<AvatarProps>[];

  if (!children.length) return null;

  const firstLink = children[0].props.link;
  const label = children[0].props.label;

  return (
    <div className={clsx('isolate flex items-center pl-10', className)}>
      {children.map((avatar, index) => (
        <div
          key={index}
          style={{zIndex: 5 - index}}
          className={clsx(
            'relative -ml-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-bg-alt bg-alt',
          )}
        >
          {avatar}
        </div>
      ))}
      <div className="ml-10 whitespace-nowrap text-sm">
        {firstLink && label ? (
          <Link to={firstLink} className="hover:underline">
            {label}
          </Link>
        ) : null}
        {showMore && children.length > 1 && (
          <span>
            {' '}
            <Trans
              message="+ :count more"
              values={{count: children.length - 1}}
            />
          </span>
        )}
      </div>
    </div>
  );
}
