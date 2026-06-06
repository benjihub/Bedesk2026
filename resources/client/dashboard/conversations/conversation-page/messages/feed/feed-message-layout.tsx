import {AvatarProps} from '@ui/avatar/avatar';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import clsx from 'clsx';
import {ReactElement, ReactNode} from 'react';

export interface FeedMessageLayoutProps {
  align: 'left' | 'right';
  avatar?: ReactElement<AvatarProps>;
  avatarInvisible?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  className?: string;
  messageId?: string | number;
}
export function FeedMessageLayout({
  align,
  avatarInvisible = false,
  avatar,
  children,
  footer,
  maxWidth = 'max-w-320',
  className,
  messageId,
}: FeedMessageLayoutProps) {
  return (
    <div
      data-message-id={messageId}
      className={clsx(
        'flex items-start gap-8',
        align === 'right' && 'flex-row-reverse',
        className,
      )}
    >
      {avatar != null && (
        <div className="mt-2 min-w-24">{!avatarInvisible && avatar}</div>
      )}
      <div className={clsx('w-max', maxWidth)}>
        <div
          className={clsx(
            'flex flex-col gap-8',
            align === 'right' && 'items-end',
          )}
        >
          {children}
        </div>
        {footer && (
          <div
            className={clsx(
              'mt-4 block text-[11px] text-muted empty:hidden',
              align === 'right' && 'text-end',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function AiAgentNamePrefix() {
  const {aiAgent} = useSettings();
  return aiAgent?.name || <Trans message="AI assistant" />;
}
