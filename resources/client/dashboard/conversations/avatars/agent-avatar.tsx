import {useAgentWasActiveRecently} from '@app/dashboard/agents/use-compact-agents';
import {UserAvatarProps} from '@common/auth/user-avatar';
import {Avatar} from '@ui/avatar/avatar';
import {OnlineStatusCircle} from '@ui/badge/online-status-circle';

export function AgentAvatar({user, size, className}: UserAvatarProps) {
  return (
    <Avatar
      label={user.name}
      src={user.image}
      fallback="initials"
      circle
      size={size}
      className={className}
    />
  );
}

interface AgentAvatarWithIndicatorProps extends UserAvatarProps {
  showAwayIcon?: boolean;
}
export function AgentAvatarWithIndicator({
  showAwayIcon,
  ...props
}: AgentAvatarWithIndicatorProps) {
  const wasActiveRecently = useAgentWasActiveRecently(props.user.id);
  return (
    <div className="relative">
      <AgentAvatar {...props} />
      <OnlineStatusCircle
        isOnline={wasActiveRecently}
        showAwayIcon={showAwayIcon}
        className="absolute -left-2 -top-2"
      />
    </div>
  );
}
