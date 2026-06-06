import {AnimatedChatMessage} from '@app/dashboard/conversations/conversation-page/messages/animated-chat-message';
import {
  ConversationMessage,
  PlaceholderConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FeedAttachments} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-attachments';
import {FeedBubble} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-bubble';
import {
  AiAgentNamePrefix,
  FeedMessageLayout,
  FeedMessageLayoutProps,
} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-message-layout';
import {FormattedMessageBody} from '@app/dashboard/conversations/conversation-page/messages/formatted-message-body';
import {MessageDate} from '@app/dashboard/conversations/conversation-page/messages/message-date';
import {useHandleButtonAction} from '@livechat/widget/conversation-screen/feed/use-handle-button-action';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {Button} from '@ui/buttons/button';
import {BulletSeparatedItems} from '@ui/list/bulled-separated-items';
import clsx from 'clsx';

const previewSearchParams = {
  policy: 'conversationFileEntry',
  _xChatWidget: 'true',
  _widget_auth: getWidgetBootstrapData().widgetAuthToken || '',
};

interface Props
  extends Omit<
    FeedMessageLayoutProps,
    'children' | 'footer' | 'avatarInvisible'
  > {
  message: ConversationMessage | PlaceholderConversationMessage;
  color: 'primary' | 'chip';
  isLastInGroup?: boolean;
  isLast?: boolean;
}
export function WidgetChatFeedMessage({
  message,
  color,
  isLastInGroup = true,
  isLast = true,
  ...layoutProps
}: Props) {
  const data = message.data ?? {};
  const bubbleClassName =
    message.author === 'user'
      ? '!bg-primary/20 dark:!bg-primary dark:!text-on-primary shadow-md dark:shadow-none !p-16'
      : '!bg-elevated border shadow-md dark:shadow-none !p-16';
  return (
    <AnimatedChatMessage uuid={message.uuid}>
      <FeedMessageLayout
        {...layoutProps}
        className={clsx(isLastInGroup ? 'mb-12' : 'mb-4')}
        avatarInvisible={!isLastInGroup}
        footer={
          isLastInGroup ? (
            <BulletSeparatedItems>
              {message.author === 'bot' && <AiAgentNamePrefix />}
              {message.created_at && (
                <time>
                  <MessageDate date={message.created_at} />
                </time>
              )}
            </BulletSeparatedItems>
          ) : null
        }
      >
        {message.body ? (
          <FeedBubble color={color} allowBreak className={bubbleClassName}>
            <FormattedMessageBody
              isStreaming={message.type === 'streaming'}
              addParagraphSpacing={message.author === 'bot'}
            >
              {message.body}
            </FormattedMessageBody>
          </FeedBubble>
        ) : null}
        {message.attachments?.length ? (
          <FeedAttachments
            align={layoutProps.align}
            onSelected={file => {
              window.open(file.url, '_blank')?.focus();
            }}
            attachments={message.attachments}
            color={color}
            previewSearchParams={previewSearchParams}
          />
        ) : null}
      </FeedMessageLayout>
      {!!data.buttons?.length && isLast && (
        <Buttons message={message} buttons={data.buttons} />
      )}
    </AnimatedChatMessage>
  );
}

interface ButtonsProps {
  message: Props['message'];
  buttons: NonNullable<ConversationMessage['data']>['buttons'];
}
function Buttons({buttons, message}: ButtonsProps) {
  const {handleButtonAction, isPending} = useHandleButtonAction(message);
  return (
    <div className="mb-24 mt-12 flex flex-wrap justify-end gap-10">
      {buttons?.map((button, index) => (
        <Button
          key={index}
          variant="outline"
          color="primary"
          className="max-w-full overflow-hidden overflow-ellipsis shadow"
          fontWeight="font-medium"
          disabled={isPending}
          onClick={() => handleButtonAction(button)}
        >
          {button.name}
        </Button>
      ))}
    </div>
  );
}
