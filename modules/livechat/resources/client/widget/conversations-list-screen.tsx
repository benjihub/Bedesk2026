import {ConversationListItemType} from '@app/dashboard/conversation';
import {MessageAuthorName} from '@app/dashboard/conversations/conversation-page/messages/message-author-name';
import {MessageAvatar} from '@app/dashboard/conversations/conversation-page/messages/message-avatar';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {UnseenMessagesBadge} from '@app/dashboard/websockets/unseen-messages-badge';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {BulletSeparatedItems} from '@common/ui/other/bullet-seprated-items';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {WidgetScreenHeader} from '@livechat/widget/widget-screen-header';
import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {getCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {SendIcon} from '@ui/icons/material/Send';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {ProgressCircle} from '@ui/progress/progress-circle';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Link} from 'react-router';

export function ConversationsListScreen() {
  const query = useInfiniteQuery(widgetQueries.conversations.index());

  return (
    <div className="relative flex min-h-0 flex-auto flex-col">
      <WidgetScreenHeader label={<Trans message="Conversations" />} />
      <AnimatePresence initial={false} mode="wait">
        {query.data ? <ConversationList query={query} /> : <LoadingIndicator />}
      </AnimatePresence>
      <Button
        variant="flat"
        color="primary"
        elementType={Link}
        to={'/conversations/new'}
        state={{prevPath: '/conversations'}}
        endIcon={<SendIcon />}
        className="absolute bottom-12 left-0 right-0 mx-auto max-w-max"
      >
        <Trans message="New conversation" />
      </Button>
    </div>
  );
}

interface ConversationListProps {
  query: UseInfiniteQueryResult<
    InfiniteData<PaginatedBackendResponse<ConversationListItemType>>
  >;
}
function ConversationList({query}: ConversationListProps) {
  const conversations = query.data?.pages.flatMap(p => p.pagination.data) || [];

  if (conversations.length === 0) {
    return (
      <m.div
        key="no-conversations"
        {...opacityAnimation}
        className="flex h-full w-full items-center justify-center"
      >
        <IllustratedMessage
          size="sm"
          image={<MessagesSquareIcon size="md" />}
          imageHeight="h-auto"
          imageMargin="mb-12"
          title={<Trans message="No conversations yet" />}
          description={
            <Trans message="All your conversations will be shown here" />
          }
        />
      </m.div>
    );
  }

  return (
    <m.div
      {...opacityAnimation}
      key="coversations"
      className="compact-scrollbar flex-auto overflow-y-auto"
    >
      {conversations.map(conversation => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
        />
      ))}
      <InfiniteScrollSentinel key="sentinel" query={query} />
    </m.div>
  );
}

interface ConversationListItemProps {
  conversation: ConversationListItemType;
}
function ConversationListItem({conversation}: ConversationListItemProps) {
  const message = conversation.latest_message;
  if (!message) return null;

  return (
    <Link
      to={`/conversations/${conversation.id}`}
      state={{prevPath: '/conversations'}}
      key={conversation.id}
      className={clsx(
        'flex items-center gap-8 border-b border-divider-lighter px-20 py-16 transition-button hover:bg-hover',
        conversation.status_category <= statusCategory.closed && 'bg-alt',
      )}
    >
      <MessageAvatar size="lg" message={message} />
      <div className="flex-auto text-sm">
        <div className="flex items-center gap-8">
          <BulletSeparatedItems className="text-muted">
            <div>
              <MessageAuthorName message={message} personalize />
            </div>
            <div>
              <FormattedRelativeTime
                style="narrow"
                date={
                  message?.created_at ?? getCurrentDateTime().toAbsoluteString()
                }
              />
            </div>
            {conversation.type === 'ticket' && <Trans message="Ticket" />}
          </BulletSeparatedItems>
          <UnseenMessagesBadge conversationId={conversation.id} />
        </div>
        <div className="line-clamp-2">{message.body}</div>
      </div>
      <KeyboardArrowRightIcon className="text-primary" size="sm" />
    </Link>
  );
}

function LoadingIndicator() {
  return (
    <m.div
      key="loading"
      {...opacityAnimation}
      className="flex flex-auto items-center justify-center"
    >
      <ProgressCircle isIndeterminate />
    </m.div>
  );
}
