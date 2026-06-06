import {SvgIconProps} from '@common/ui/library/icons/svg-icon';
import {ReactElement, ReactNode} from 'react';

interface Props {
  icon: ReactElement<SvgIconProps>;
  title: ReactElement;
  description: ReactElement;
  children: ReactNode;
  action: ReactElement;
}
export function KnowledgePageSectionLayout({
  icon,
  title,
  description,
  children,
  action,
}: Props) {
  return (
    <div className="rounded-panel border p-20">
      <div className="items-center gap-16 md:flex">
        <div className="flex items-center gap-12 max-md:mb-20">
          {icon}
          <div>
            <div className="text-base font-semibold leading-6">{title}</div>
            <p className="text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className="ml-auto">{action}</div>
      </div>
      <div className="mt-8 divide-y empty:hidden">{children}</div>
    </div>
  );
}
