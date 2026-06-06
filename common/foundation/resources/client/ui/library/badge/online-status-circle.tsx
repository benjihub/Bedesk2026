import React from 'react';
import {Tooltip} from '@ui/tooltip/tooltip';
import {Trans} from '@ui/i18n/trans';
import {HourglassEmptyIcon} from '@ui/icons/material/HourglassEmpty';
import clsx from 'clsx';

interface Props {
  isOnline?: boolean;
  showAwayIcon?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function OnlineStatusCircle(props: Props) {
  const {isOnline, color, className, showAwayIcon} = props;
  return (
    <Tooltip
      label={
        isOnline ? (
          <Trans message="Online" />
        ) : showAwayIcon ? (
          <Trans message="Away" />
        ) : (
          <Trans message="Offline" />
        )
      }
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-full border-1 border-on-primary bg-clip-padding',
          color ? color : isOnline ? 'bg-positive-darker' : 'bg-chip',
          getSize(props),
          className,
        )}
      >
        {!isOnline && showAwayIcon && (
          <HourglassEmptyIcon size="2xs" className="text-muted" />
        )}
      </div>
    </Tooltip>
  );
}

function getSize({size, showAwayIcon, isOnline}: Props) {
  switch (size) {
    case 'md':
      return 'h-20 w-20';
    case 'lg':
      return 'h-34 w-34';
    default:
      return !isOnline && showAwayIcon ? 'h-18 w-18' : 'h-12 w-12';
  }
}
