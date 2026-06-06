import {LucideIconWrapper} from '@ui/icons/lucide/lucide-icon-wrapper';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {forwardRef} from 'react';

export const PanelLeftIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  (props, ref) => (
    <LucideIconWrapper {...props} ref={ref}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </LucideIconWrapper>
  ),
);
