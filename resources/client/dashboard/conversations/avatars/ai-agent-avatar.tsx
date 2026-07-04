import {useWidgetLogoSrc} from '@livechat/widget/hooks/use-widget-logo-src';
import {Avatar, AvatarProps} from '@ui/avatar/avatar';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  size?: AvatarProps['size'];
  className?: string;
  showOnlineIndicator?: boolean;
  aiAgent?: {
    name?: string | null;
    image?: string | null;
  } | null;
}
export function AiAgentAvatar({
  className,
  size,
  showOnlineIndicator,
  aiAgent: aiAgentOverride,
}: Props) {
  const {aiAgent} = useSettings();
  const logoSrc = useWidgetLogoSrc();
  const label = aiAgentOverride?.name || aiAgent?.name || 'AI assistant';
  const image = aiAgentOverride?.image || aiAgent?.image || logoSrc;

  const avatar = (
    <Avatar
      fallback="initials"
      label={label}
      labelForBackground={label}
      src={image}
      className={className}
      size={size}
    />
  );

  if (!showOnlineIndicator) {
    return avatar;
  }

  return (
    <div className="relative">
      {avatar}
      <OnlineStatusCircle isOnline className="absolute -left-2 -top-2" />
    </div>
  );
}
