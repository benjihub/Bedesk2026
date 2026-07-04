import {MessageAuthorName} from '@app/dashboard/conversations/conversation-page/messages/message-author-name';
import {MessageAvatar} from '@app/dashboard/conversations/conversation-page/messages/message-avatar';
import {useWidgetChatMessages} from '@livechat/widget/conversation-screen/requests/use-widget-chat-messages';
import {HomeScreenCardLayout} from '@livechat/widget/home/home-screen-card-layout';
import {useWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {getCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {useTrans} from '@ui/i18n/use-trans';
import {Button} from '@ui/buttons/button';
import {SendIcon} from '@ui/icons/material/Send';
import {useSettings} from '@ui/settings/use-settings';
import {stripTags} from '@ui/utils/string/strip-tags';
import memoized from 'nano-memoize';
import {useNavigate} from 'react-router';

const memoStripTags = memoized(stripTags);

interface Props {
  chatId: number;
}
export function ResumeChatCard({chatId}: Props) {
  const chatQuery = useQuery(widgetQueries.conversations.get(chatId));
  const messagesQuery = useWidgetChatMessages(chatId);
  const {chatWidget} = useSettings();
  const {aiAgent} = useWidgetBootstrapData();
  const {trans} = useTrans();
  const navigate = useNavigate();

  if (!chatQuery.data?.conversation || !chatQuery.data?.items) {
    return null;
  }

  const {conversation} = chatQuery.data;

  const lastMsg = messagesQuery.data?.items.at(-1);
  if (!lastMsg) return null;

  const lastMsgText =
    lastMsg?.type === 'message'
      ? memoStripTags(lastMsg.body)
      : trans({message: chatWidget?.defaultMessage ?? ''});

  return (
    <HomeScreenCardLayout className="rounded-3xl bg border-0 shadow-sm">
      <div className="px-24 py-20">
        <div className="mb-20 flex items-start gap-14">
          <div className="relative flex-shrink-0">
            <MessageAvatar
              message={lastMsg}
              size="w-52 h-52"
              agentWithIndicator
              aiAgent={aiAgent ?? null}
            />
            {lastMsg.author === 'bot' ? (
              <div className="absolute left-0 top-0 h-14 w-14 rounded-full border-2 border bg-positive" />
            ) : null}
          </div>
          <div className="min-w-0 flex-auto">
            <div className="font-semibold text-lg mb-10">
              <MessageAuthorName message={lastMsg} />
            </div>
            <div
              className="line-clamp-2 text-base leading-relaxed"
              dangerouslySetInnerHTML={{__html: lastMsgText}}
            />
          </div>
        </div>

        <Button
          onClick={() => navigate(`/conversations/${conversation.id}`)}
          justify="justify-center"
          variant="flat"
          color="primary"
          className="w-full min-h-56 text-lg font-semibold rounded-3xl"
          endIcon={<SendIcon />}
        >
          <Trans message={chatWidget?.homeNewChatTitle ?? 'Let\'s Chat'} />
        </Button>
      </div>
    </HomeScreenCardLayout>
  );
}
