import {ConversationListLayoutToggle} from '@app/dashboard/conversations/conversation-list-layout-toggle';
import {ConversationListSkeleton} from '@app/dashboard/conversations/conversation-page/conversation-list-skeleton';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {ConversationsListItem} from '@app/dashboard/conversations/conversations-list/conversations-list-item';
import {useInfiniteActiveViewConverations} from '@app/dashboard/conversations/utils/use-active-view-converstions';
import {useActiveViewName} from '@app/dashboard/conversations/utils/use-active-view-name';
import {InboxSectionHeader} from '@app/dashboard/dashboard-layout/inbox-section-header';
import {UnseenMessagesBadge} from '@app/dashboard/websockets/unseen-messages-badge';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {ToggleLeftSidebarIcon} from '@ui/icons/toggle-left-sidebar-icon';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, useContext} from 'react';
import {useParams} from 'react-router';

export function ConversationsListSidebar() {
  const {isMobileMode} = useContext(DashboardLayoutContext);
  const {conversationListOpen, conversationPageViewsSidebarOpen} =
    useAgentInboxLayout();
  const isVisible = conversationListOpen && !isMobileMode;

  const sidebar = (
    <m.div
      initial={{width: 0, opacity: 0}}
      animate={{width: '', opacity: 1}}
      exit={{width: 0, opacity: 0}}
      transition={{duration: 0.1}}
      className={clsx(
        'inbox-conversation-list dashboard-rounded-panel flex flex-shrink-0 flex-col lg:ml-8',
        conversationPageViewsSidebarOpen && 'compact',
      )}
    >
      <Header />
      <ConversationsListContainer />
    </m.div>
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      {isVisible && sidebar}
    </AnimatePresence>
  );
}

function Header() {
  const {conversationPageViewsSidebarOpen, toggleConversationPageViewsSidebar} =
    useAgentInboxLayout();
  const viewName = useActiveViewName();

  return (
    <InboxSectionHeader gap="gap-4">
      <Tooltip
        placement="bottom"
        label={
          !conversationPageViewsSidebarOpen ? (
            <Trans message="Show views sidebar" />
          ) : (
            <Trans message="Hide views sidebar" />
          )
        }
      >
        <IconButton
          size="xs"
          onClick={() => toggleConversationPageViewsSidebar()}
        >
          <ToggleLeftSidebarIcon />
        </IconButton>
      </Tooltip>
      {viewName ? (
        <Trans message={viewName} />
      ) : (
        <Trans message="Conversations" />
      )}
      <ConversationListLayoutToggle className="ml-auto" />
    </InboxSectionHeader>
  );
}

function ConversationsListContainer() {
  const {conversationId} = useParams();
  const {query, isEmpty, items} = useInfiniteActiveViewConverations();

  return (
    <div className="compact-scrollbar flex-auto overflow-y-auto">
      <AnimatePresence initial={false} mode="wait">
        {!isEmpty ? (
          <Fragment>
            <m.div
              key="grouped-chats"
              className="space-y-4 p-8"
              {...opacityAnimation}
            >
              {items.map(conversation => (
                <ConversationsListItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={`${conversationId}` === `${conversation.id}`}
                  badge={
                    <UnseenMessagesBadge
                      conversationId={conversation.id}
                      className="ml-auto"
                    />
                  }
                />
              ))}
              <InfiniteScrollSentinel query={query} />
            </m.div>
          </Fragment>
        ) : query.isLoading ? (
          <ConversationListSkeleton count={3} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <IllustratedMessage
              size="xs"
              image={<MessagesSquareIcon size="lg" />}
              imageMargin="mb-12"
              imageHeight="h-auto"
              title={<Trans message="No conversations in this view" />}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
