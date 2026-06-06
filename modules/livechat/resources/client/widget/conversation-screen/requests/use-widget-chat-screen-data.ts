import {statusCategory} from '@app/dashboard/statuses/status-category';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {useWidgetChatMessages} from '@livechat/widget/conversation-screen/requests/use-widget-chat-messages';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {useSettings} from '@ui/settings/use-settings';
import {useParams} from 'react-router';

export function useWidgetConversationScreenData() {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const {chatWidget} = useSettings();
  const postChatForm = chatWidget?.forms?.postChat;
  const {conversationId} = useParams();

  // always show placeholder chat feed in appearance editor
  const conversationQuery = useQuery(
    widgetQueries.conversations.get(
      isAppearanceEditorActive ? undefined : conversationId,
    ),
  );
  // "new" is for displaying user messages before chat is created
  const messagesQuery = useWidgetChatMessages(
    isAppearanceEditorActive ? undefined : conversationId,
  );

  const postChatFormIsVisible =
    conversationQuery.data &&
    !conversationQuery.data.hasPostChatForm &&
    !!postChatForm?.attributes?.length &&
    conversationQuery.data.conversation.status_category <=
      statusCategory.closed &&
    !postChatForm?.disabled;

  return {
    conversationQuery,
    messagesQuery,
    postChatFormIsVisible,
  };
}
