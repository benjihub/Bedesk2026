import {SvgIcon, SvgIconProps} from '@ui/icons/svg-icon';
import {forwardRef} from 'react';

export const LucideIconWrapper = forwardRef<SVGSVGElement, SvgIconProps>(
  ({children, size = 'md', ...props}, ref) => {
    return (
      <SvgIcon
        fill="fill-none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        size={size}
        {...props}
        ref={ref}
      >
        {children}
      </SvgIcon>
    );
  },
);
