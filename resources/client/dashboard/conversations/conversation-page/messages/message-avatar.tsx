import {
  AgentAvatar,
  AgentAvatarWithIndicator,
} from '@app/dashboard/conversations/avatars/agent-avatar';
import {AiAgentAvatar} from '@app/dashboard/conversations/avatars/ai-agent-avatar';
import {CustomerAvatar} from '@app/dashboard/conversations/avatars/customer-avatar';
import {SystemAvatar} from '@app/dashboard/conversations/avatars/system-avatar';
import {AvatarProps} from '@ui/avatar/avatar';
import {ConversationMessage} from './conversation-message';

interface MessageAvatarProps {
  message: Pick<ConversationMessage, 'author' | 'user'>;
  size?: AvatarProps['size'];
  agentWithIndicator?: boolean;
}
export function MessageAvatar({
  message,
  size,
  agentWithIndicator,
}: MessageAvatarProps) {
  if (message.author === 'bot') {
    return <AiAgentAvatar size={size} />;
  }
  if (message.author === 'user') {
    return message.user ? (
      <CustomerAvatar user={message.user} size={size} />
    ) : null;
  }
  if (message.author === 'system') {
    return <SystemAvatar size={size} />;
  }
  return message.user ? (
    agentWithIndicator ? (
      <AgentAvatarWithIndicator user={message.user} size={size} showAwayIcon />
    ) : (
      <AgentAvatar user={message.user} size={size} />
    )
  ) : null;
}
