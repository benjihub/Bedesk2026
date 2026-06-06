import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {
  WidgetChatForm,
  WidgetChatFormValue,
} from '@livechat/widget/chat/forms/widget-chat-form';
import {useChatMessageSubmitter} from '@livechat/widget/conversation-screen/requests/use-chat-message-submitter';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  isPending?: boolean;
  onSubmit?: (values: WidgetChatFormValue) => void;
}
export function WidgetPreChatForm({onSubmit, isPending}: Props) {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const {chatWidget} = useSettings();
  const {createChat} = useChatMessageSubmitter();
  const fields = chatWidget?.forms?.preChat?.attributes;
  if (!fields?.length) {
    return null;
  }

  return (
    <div className="animated-chat-message">
      <WidgetChatForm
        attributeIds={fields}
        information={chatWidget?.forms?.preChat?.information}
        onSubmit={async values => {
          if (isAppearanceEditorActive) return;
          // If parent provided an onSubmit handler, delegate creation to it
          if (onSubmit) {
            try {
              await onSubmit(values as any);
            } catch (e) {
              // swallow - caller will handle errors/toasts
            }
            return;
          }

          // ensure chat (ticket) is created immediately when no parent handler
          try {
            await createChat({preChatForm: values, startWithGreeting: false});
          } catch (e) {
            // swallow - createChat will show toast on error
          }
        }}
        submitButtonLabel={<Trans message="Start the chat" />}
        isPending={isPending ?? false}
      />
    </div>
  );
}
