import {LucideIconWrapper} from '@ui/icons/lucide/lucide-icon-wrapper';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {forwardRef} from 'react';

export const ColumnCogIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  (props, ref) => (
    <LucideIconWrapper {...props} ref={ref}>
      <path d="M10.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5" />
      <path d="m14.3 19.6 1-.4" />
      <path d="M15 3v7.5" />
      <path d="m15.2 16.9-.9-.3" />
      <path d="m16.6 21.7.3-.9" />
      <path d="m16.8 15.3-.4-1" />
      <path d="m19.1 15.2.3-.9" />
      <path d="m19.6 21.7-.4-1" />
      <path d="m20.7 16.8 1-.4" />
      <path d="m21.7 19.4-.9-.3" />
      <path d="M9 3v18" />
    </LucideIconWrapper>
  ),
);
