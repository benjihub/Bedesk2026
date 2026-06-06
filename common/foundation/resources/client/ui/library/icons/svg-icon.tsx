import clsx from 'clsx';
import React, {forwardRef, RefObject} from 'react';

export type IconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;

export interface SvgIconProps extends React.SVGAttributes<SVGElement> {
  children?: React.ReactNode;
  size?: IconSize | null;
  color?: string;
  title?: string;
  fill?: string;
  ref?: RefObject<SVGSVGElement | null>;
}

export const SvgIcon = forwardRef<SVGSVGElement, SvgIconProps & {attr?: {}}>(
  (props, ref) => {
    const {
      attr,
      size,
      title,
      className,
      color,
      style,
      children,
      viewBox,
      width,
      height,
      fill = 'fill-current',
      ...svgProps
    } = props;

    return (
      <svg
        aria-hidden={!title}
        focusable={false}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox || '0 0 24 24'}
        {...attr}
        {...svgProps}
        className={clsx('svg-icon', fill, className, getSizeClassName(size))}
        style={{
          color,
          ...style,
        }}
        ref={ref}
        height={height || '1em'}
        width={width || '1em'}
      >
        {title && <title>{title}</title>}
        {children}
      </svg>
    );
  },
);

function getSizeClassName(size?: IconSize | null) {
  switch (size) {
    case '2xs':
      return 'icon-2xs';
    case 'xs':
      return 'icon-xs';
    case 'sm':
      return 'icon-sm';
    case 'md':
      return 'icon-md';
    case 'lg':
      return 'icon-lg';
    case 'xl':
      return 'icon-xl';
    default:
      return size;
  }
}
