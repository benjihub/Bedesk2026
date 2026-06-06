import {AnimatedChatMessage} from '@app/dashboard/conversations/conversation-page/messages/animated-chat-message';
import {CollectDetailsMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {useSubmitChatForm} from '@livechat/widget/chat/forms/use-submit-chat-form';
import {WidgetChatForm} from '@livechat/widget/chat/forms/widget-chat-form';
import {Trans} from '@ui/i18n/trans';

interface Props {
  message: CollectDetailsMessage;
  disabled?: boolean;
}
export function WidgetCollectDetailsForm({message, disabled}: Props) {
  const submitMessage = useSubmitChatForm(message.conversation_id);

  if (!message.body.attributeIds?.length || message.body.submitted) {
    return null;
  }

  return (
    <AnimatedChatMessage uuid={message.uuid}>
      <WidgetChatForm
        attributeIds={message.body.attributeIds}
        information={message.body.message}
        onSubmit={values => {
          submitMessage.mutate({
            type: 'collectDetails',
            values,
          });
        }}
        submitButtonLabel={<Trans message="Submit" />}
        isPending={submitMessage.isPending}
        disabled={disabled}
      />
    </AnimatedChatMessage>
  );
}
