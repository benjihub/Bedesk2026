import {LucideIconWrapper} from '@ui/icons/lucide/lucide-icon-wrapper';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {forwardRef} from 'react';

export const AlignLeftIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  (props, ref) => (
    <LucideIconWrapper {...props} ref={ref}>
      <path d="M15 12H3" />
      <path d="M17 18H3" />
      <path d="M21 6H3" />
    </LucideIconWrapper>
  ),
);
