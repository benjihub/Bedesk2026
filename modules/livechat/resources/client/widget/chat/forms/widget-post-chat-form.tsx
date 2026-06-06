import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {useSubmitChatForm} from '@livechat/widget/chat/forms/use-submit-chat-form';
import {
  WidgetChatForm,
  WidgetChatFormValue,
} from '@livechat/widget/chat/forms/widget-chat-form';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';

interface Props {
  chatId: string | number;
}
export function WidgetPostChatForm({chatId}: Props) {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const {chatWidget} = useSettings();
  const fields = chatWidget?.forms?.postChat?.attributes;
  const submitFormData = useSubmitChatForm(chatId);
  if (!fields?.length) {
    return null;
  }

  const handleSubmit = (values: WidgetChatFormValue) => {
    if (isAppearanceEditorActive) return;
    submitFormData.mutate({
      type: 'postChat',
      values,
    });
  };

  return (
    <div className="animated-chat-message">
      <WidgetChatForm
        attributeIds={fields}
        information={chatWidget?.forms?.postChat?.information}
        onSubmit={handleSubmit}
        submitButtonLabel={<Trans message="Submit" />}
        isPending={submitFormData.isPending}
      />
    </div>
  );
}
