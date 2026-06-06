import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {isLastItemInGroup} from '@app/dashboard/conversations/conversation-page/messages/feed/is-last-item-in-group';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {WidgetPostChatForm} from '@livechat/widget/chat/forms/widget-post-chat-form';
import {WidgetPreChatForm} from '@livechat/widget/chat/forms/widget-pre-chat-form';
import {WidgetChatFeedContentItem} from '@livechat/widget/conversation-screen/feed/widget-chat-feed-content-item';
import {useChatMessageSubmitter} from '@livechat/widget/conversation-screen/requests/use-chat-message-submitter';
import {useWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {useSettings} from '@ui/settings/use-settings';
import {Fragment, useMemo, useRef} from 'react';
import {useLocation, useParams} from 'react-router';

type Props = {
  disablePreChatForm?: boolean;
};
export function WidgetChatGreeting({disablePreChatForm}: Props) {
  const {state} = useLocation();
  const {isInsideSettingsPreview, settingsEditorParams} =
    useSettingsPreviewMode();
  const {conversationId} = useParams();
  const {chatWidget} = useSettings();
  const preChatForm = chatWidget?.forms?.preChat;
  const {isPending, createChat} = useChatMessageSubmitter();

  const {newChatGreeting} = useWidgetBootstrapData();

  if (conversationId && !isInsideSettingsPreview) {
    return null;
  }

  if (isInsideSettingsPreview) {
    if (settingsEditorParams.form === 'postChat') {
      return <WidgetPostChatForm chatId={0} />;
    } else if (settingsEditorParams.form === 'preChat') {
      return <WidgetPreChatForm />;
    }
  } else if (
    !disablePreChatForm &&
    !preChatForm?.disabled &&
    !!preChatForm?.attributes.length
  ) {
    const startWithGreeting = !state?.messageBody;
    return (
      <WidgetPreChatForm
        isPending={isPending}
        onSubmit={values => {
          createChat({
            preChatForm: values,
            // message body might be passed through from campaign handler
            message: state?.messageBody
              ? {
                  body: state.messageBody,
                  attachments: [],
                }
              : undefined,
            startWithGreeting,
          });
        }}
      />
    );
  }

  return <GrettingMessages />;
}

function GrettingMessages() {
  const {newChatGreeting} = useWidgetBootstrapData();
  const alreadyAdded = useRef<boolean>(false);

  useMemo(() => {
    if (alreadyAdded.current) return;
    newChatGreeting?.parts.forEach(message => {
      addAnimatingMessage(message.uuid);
    });
    alreadyAdded.current = true;
  }, [newChatGreeting?.parts]);

  return (
    <Fragment>
      {newChatGreeting?.parts.map((message, index) => (
        <WidgetChatFeedContentItem
          key={message.uuid}
          message={message}
          {...isLastItemInGroup(index, message, newChatGreeting.parts)}
        />
      ))}
    </Fragment>
  );
}
