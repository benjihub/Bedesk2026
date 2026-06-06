import {AgentReplyComposer} from '@app/dashboard/conversations/agent-reply-composer/agent-reply-composer';
import {AgentReplyComposerStoreProvider} from '@app/dashboard/conversations/agent-reply-composer/agent-reply-composer-store';
import {ConversationsListSidebar} from '@app/dashboard/conversations/conversation-page/conversations-list-sidebar';
import {ConversationDetailsSidebar} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-details-sidebar';
import {FeedView} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-view';
import {ListView} from '@app/dashboard/conversations/conversation-page/messages/list/list-view';
import {ConversationPageToolbar} from '@app/dashboard/conversations/conversation-page/toolbar/conversation-page-toolbar';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {useCustomerName} from '@app/dashboard/conversations/customer-name';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {InboxViewsSidebar} from '@app/dashboard/inbox/inbox-views-sidebar';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardSidenav} from '@common/ui/dashboard-layout/dashboard-sidenav';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Fragment, useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';

export function Component() {
  const {conversationId} = useRequiredParams(['conversationId']);
  const query = useSuspenseQuery(
    helpdeskQueries.conversations.getFast(conversationId),
  );
  const customerName = useCustomerName(query.data.user);

  return (
    <Fragment>
      <StaticPageTitle>
        {query.data.conversation.subject || customerName}
      </StaticPageTitle>
      <InboxViewsSidebar location="conversationPage" />
      <ConversationsListSidebar />
      <ConversationColumn />
      <DashboardSidenav position="right" size="w-[300px]">
        <ConversationDetailsSidebar data={query.data} />
      </DashboardSidenav>
    </Fragment>
  );
}

function ConversationColumn() {
  const {conversationId} = useRequiredParams(['conversationId']);
  const query = useSuspenseQuery(
    helpdeskQueries.conversations.getFast(conversationId),
  );
  const {messagesLayout} = useAgentInboxLayout();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = query.data.conversation.id;
    const opts = helpdeskQueries.conversations.messages(id);
    // ensure messages for this conversation are loaded in background so
    // the conversation history is immediately available to agents
    queryClient.ensureInfiniteQueryData(opts.queryKey, opts.queryFn as any).catch(() => {});
    // also ensure the full conversation is loaded
    const fullOpts = helpdeskQueries.conversations.get(conversationId);
    queryClient.ensureQueryData(fullOpts.queryKey, fullOpts.queryFn as any).catch(() => {});
  }, [query.data.conversation.id, queryClient]);

  return (
    <main className="compact-scrollbar dashboard-grid-content dashboard-rounded-panel md:min-w-440 lg:ml-8">
      <div className="flex h-full flex-col">
        <ConversationPageToolbar data={query.data} />
        {messagesLayout === 'list' ? (
          <ListView data={query.data} />
        ) : (
          <FeedView data={query.data} />
        )}
        <FileUploadProvider key={query.data.conversation.id}>
          <AgentReplyComposerStoreProvider
            conversation={query.data.conversation}
          >
            <AgentReplyComposer data={query.data} />
          </AgentReplyComposerStoreProvider>
        </FileUploadProvider>
      </div>
    </main>
  );
}
