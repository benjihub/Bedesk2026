import {AvatarProps} from '@ui/avatar/avatar';
import clsx from 'clsx';
import {forwardRef, useMemo} from 'react';

const colors = [
  '#3b82f6',
  '#6366f1',
  '#0284c7',
  '#9333ea',
  '#059669',
  '#ea580c',
  '#dc2626',
  '#06b6d4',
  '#e11d48',
];

interface Props {
  size: AvatarProps['size'];
  label: string;
  labelForBackground?: string;
  color?: string;
}
export const AvatarInitialsFallback = forwardRef<HTMLDivElement, Props>(
  ({size, label, labelForBackground, color}, ref) => {
    const {initial, bgColor} = useMemo(() => {
      const bgLabel = labelForBackground || label || '';
      const hash = `${bgLabel}`
        .split('')
        .reduce((accum, val) => val.charCodeAt(0) + accum, bgLabel.length);
      return {
        initial: getInitial(`${label}`),
        bgColor: colors[hash % colors.length],
      };
    }, [label, labelForBackground]);
    return (
      <div
        ref={ref}
        style={!color ? {backgroundColor: bgColor} : undefined}
        className={clsx(
          'flex h-full w-full items-center justify-center font-semibold leading-normal text-on-primary',
          color,
          getTextFallbackFontSize(size),
        )}
      >
        {initial}
      </div>
    );
  },
);

function getTextFallbackFontSize(size: AvatarProps['size']) {
  switch (size) {
    case 'xs':
      return 'text-xs';
    case 'sm':
      return 'text-xs';
    case 'xl':
      return 'text-xl';
    case 'md':
      return 'text-base';
    default:
      return '';
  }
}

function getInitial(string: string) {
  string = `${string}`.replace(/\s+/g, '');
  let initial = string.slice(0, 1);
  if (!initial.match(/[a-z]/i)) {
    initial = string.slice(1, 2);
  }
  return initial.toUpperCase();
}
