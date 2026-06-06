import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {auth} from '@common/auth/use-auth';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {ConversationMessage} from './conversation-message';

interface MessageAvatarProps {
  message: Pick<ConversationMessage, 'author' | 'user'>;
  personalize?: boolean;
}
export function MessageAuthorName({message, personalize}: MessageAvatarProps) {
  const {branding, aiAgent} = useSettings();

  if (personalize && message.user && message.user.id === auth.user?.id) {
    return <Trans message="You" />;
  }

  if (message.author === 'agent' && message.user) {
    return <div>{message.user.name}</div>;
  }
  if (message.author === 'user') {
    return <CustomerName user={message.user} />;
  }
  if (message.author === 'system') {
    return <div>{branding.site_name}</div>;
  }
  if (message.author === 'bot') {
    return aiAgent?.name ? (
      <div>{aiAgent.name}</div>
    ) : (
      <Trans message="AI assistant" />
    );
  }
  return <Trans message="Unknown" />;
}
