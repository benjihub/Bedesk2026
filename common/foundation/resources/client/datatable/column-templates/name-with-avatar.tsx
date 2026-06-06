import {Avatar, AvatarProps} from '@ui/avatar/avatar';
import {Skeleton} from '@ui/skeleton/skeleton';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  image?: string | null;
  label: ReactNode;
  description?: ReactNode;
  labelClassName?: string;
  className?: string;
  avatarSize?: AvatarProps['size'];
  alwaysShowAvatar?: boolean;
  avatarLabel?: string;
  avatarCircle?: boolean;
}
export function NameWithAvatar({
  image,
  label,
  description,
  className,
  labelClassName,
  avatarSize = 'md',
  alwaysShowAvatar,
  avatarLabel,
  avatarCircle,
}: Props) {
  return (
    <div className={clsx('flex items-center gap-12', className)}>
      {(image || alwaysShowAvatar) && (
        <Avatar
          size={avatarSize}
          className="flex-shrink-0"
          src={image}
          label={avatarLabel ?? label ?? 'User'}
          fallback="initials"
          circle={avatarCircle}
        />
      )}
      <div className="min-w-0 overflow-hidden">
        <div
          className={clsx(labelClassName, 'overflow-hidden overflow-ellipsis')}
        >
          {label}
        </div>
        {description && (
          <div className="overflow-hidden overflow-ellipsis text-xs text-muted">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export function NameWithAvatarPlaceholder({
  className,
  labelClassName,
  showDescription,
  avatarCircle,
}: Partial<Props> & {
  showDescription?: boolean;
}) {
  return (
    <div
      className={clsx('flex w-full max-w-4/5 items-center gap-12', className)}
    >
      <Skeleton
        size="w-40 h-40 md:w-32 md:h-32"
        variant="rect"
        radius={avatarCircle ? 'rounded-full' : undefined}
      />
      <div className="flex-auto">
        <div className={clsx(labelClassName, showDescription && 'leading-3')}>
          <Skeleton />
        </div>
        {showDescription && (
          <div className="mt-4 leading-3 text-muted">{<Skeleton />}</div>
        )}
      </div>
    </div>
  );
}
