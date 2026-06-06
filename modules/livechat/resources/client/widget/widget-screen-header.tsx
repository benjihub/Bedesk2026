import {useIsWidgetInline} from '@livechat/widget/hooks/use-is-widget-inline';
import {widgetStore} from '@livechat/widget/widget-store';
import {IconButton} from '@ui/buttons/icon-button';
import {MinimizeIcon} from '@ui/icons/material/Minimize';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  label?: ReactNode;
  children?: ReactNode;
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
  showCloseWidgetButton?: boolean;
}
export function WidgetScreenHeader({
  label,
  children,
  start,
  end,
  className,
  showCloseWidgetButton = true,
}: Props) {
  const {isInline, isDirect} = useIsWidgetInline();
  const canCloseWidget = showCloseWidgetButton && !isInline && !isDirect;

  return (
    <div
      className={clsx(
        'flex flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-t-3xl border-b-0 bg-elevated/60 backdrop-blur-sm px-8 py-10 text-main',
        className,
      )}
    >
      <div className="grid w-full grid-cols-[auto,1fr,auto] items-center gap-8">
        <div className="flex items-center gap-8">{start}</div>
        <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-center text-lg font-semibold leading-[42px]">
          {label}
        </div>
        <div className="flex items-center justify-end gap-8">
          {end}
          {canCloseWidget && (
            <IconButton
              aria-label="Minimize widget"
              onClick={() => widgetStore().setWidgetState('closed')}
            >
              <MinimizeIcon />
            </IconButton>
          )}
        </div>
      </div>
      {children && <div className="mt-8 w-full">{children}</div>}
    </div>
  );
}
