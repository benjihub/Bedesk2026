import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {
  getFromLocalStorage,
  useLocalStorage,
} from '@ui/utils/hooks/local-storage';
import {useCallback, useContext} from 'react';

const conversationListLayoutKey = 'conversations.list.layout';

export function useAgentInboxLayout() {
  const [conversationListOpen, setConversationListOpen] = useLocalStorage(
    'conversationPage.list',
    true,
  );

  const [conversationListLayout, setConversationListLayout] = useLocalStorage<
    'chat' | 'table'
  >(conversationListLayoutKey, 'chat');

  const [
    conversationsTableViewsSidebarOpen,
    setConversationsTableViewsSidebarOpen,
  ] = useLocalStorage('conversationsTable.views', true);
  const toggleConversationsTableViewsSidebar = useCallback(() => {
    setConversationsTableViewsSidebarOpen(!conversationsTableViewsSidebarOpen);
  }, [
    conversationsTableViewsSidebarOpen,
    setConversationsTableViewsSidebarOpen,
  ]);

  const [messagesLayout, setMessagesLayout] = useLocalStorage<'feed' | 'list'>(
    'conversation.messages.layout',
    'feed',
  );

  const [
    conversationPageViewsSidebarOpen,
    setConversationPageViewsSidebarOpen,
  ] = useLocalStorage('conversationsPage.views', true);
  const {rightSidenavStatus, setRightSidenavStatus} = useContext(
    DashboardLayoutContext,
  );

  const toggleRightSidebar = useCallback(() => {
    setRightSidenavStatus(rightSidenavStatus === 'open' ? 'closed' : 'open');
  }, [rightSidenavStatus, setRightSidenavStatus]);

  const toggleConversationPageViewsSidebar = useCallback(() => {
    setConversationPageViewsSidebarOpen(!conversationPageViewsSidebarOpen);
  }, [conversationPageViewsSidebarOpen, setConversationPageViewsSidebarOpen]);

  const toggleConversationList = useCallback(() => {
    setConversationListOpen(!conversationListOpen);
  }, [conversationListOpen, setConversationListOpen]);

  return {
    toggleRightSidebar,
    toggleConversationList,
    conversationListOpen,
    conversationListLayout,
    setConversationListLayout,
    conversationsTableViewsSidebarOpen,
    toggleConversationPageViewsSidebar,
    conversationPageViewsSidebarOpen,
    toggleConversationsTableViewsSidebar,
    rightSidebarOpen: rightSidenavStatus === 'open',
    messagesLayout,
    setMessagesLayout,
  };
}

export function getConversationListLayout(): 'chat' | 'table' {
  // on dashboard mobile mode breakpoint always use table layout
  // otherwise conversations list will not be visible
  if (window.matchMedia('(max-width: 1024px)').matches) {
    return 'table';
  }
  return getFromLocalStorage(conversationListLayoutKey) || 'table';
}
