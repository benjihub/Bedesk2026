import {useAgentsAcceptingConversations} from '@livechat/widget/agents/use-widget-compact-agents';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {AskForEmailForm} from '@livechat/widget/conversation-screen/ask-for-email-form';
import {FullWidgetConversationResponse} from '@livechat/widget/conversation-screen/requests/full-widget-conversation-response';
import {Trans} from '@ui/i18n/trans';
import {HourglassEmptyIcon} from '@ui/icons/material/HourglassEmpty';
import {useSettings} from '@ui/settings/use-settings';
import {ReactNode} from 'react';

interface Props {
  data?: FullWidgetConversationResponse;
}
export function NoAgentsAvailableMessage({data}: Props) {
  const chat = data?.conversation;
  const {agents, isLoading} = useAgentsAcceptingConversations();
  const {chatWidget, aiAgent} = useSettings();
  const {
    isInsideSettingsPreview: isAppearanceEditorActive,
    settingsEditorParams: settingsEditorParams,
  } = useSettingsPreviewMode();

  const isClosed = chat && chat.status_category <= statusCategory.closed;
  const isTicket = chat && chat.type === 'ticket';
  const isHandledByBot = chat ? chat.assigned_to === 'bot' : !!aiAgent?.enabled;
  const shouldHideStatusMessage = isClosed || isTicket || isHandledByBot;

  if (
    (shouldHideStatusMessage && !isAppearanceEditorActive) ||
    settingsEditorParams?.form
  ) {
    return null;
  }

  // all agents are away or not accepting chats
  if (
    (!isLoading && (!agents?.length || isAppearanceEditorActive)) &&
    !chat?.assignee &&
    chatWidget?.agentsAwayMessage
  ) {
    return (
      <MessageCard>
        <HourglassEmptyIcon size="sm" className="mr-4" />
        <Trans message={chatWidget.agentsAwayMessage} />
        <AskForEmailForm />
      </MessageCard>
    );
  }

  // all agents are currently busy, this chat is in queue
  if (chat && !chat.assignee && chatWidget?.inQueueMessage) {
    return (
      <MessageCard>
        <HourglassEmptyIcon size="sm" className="mr-4" />
        <Trans
          message={chatWidget.inQueueMessage}
          values={{
            number: data.queuedChatInfo?.positionInQueue,
            minutes: data.queuedChatInfo?.estimatedWaitTime,
          }}
        />
      </MessageCard>
    );
  }

  return null;
}

interface MessageCardProps {
  children: ReactNode;
}
function MessageCard({children}: MessageCardProps) {
  return (
    <div className="sticky top-0 z-10 mb-20 overflow-hidden rounded-panel border bg-elevated px-10 py-8 text-sm shadow-md">
      {children}
    </div>
  );
}
