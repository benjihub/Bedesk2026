import {LucideIconWrapper} from '@ui/icons/lucide/lucide-icon-wrapper';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {forwardRef} from 'react';

export const YoutubeIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  ({size = 'md', ...props}, ref) => (
    <LucideIconWrapper {...props} ref={ref} size={size}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </LucideIconWrapper>
  ),
);
