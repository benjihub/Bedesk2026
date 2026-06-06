import chatSvg from '@app/dashboard/agents/edit-agent-page/tabs/chat.svg';
import {ConversationsListItem} from '@app/dashboard/conversations/conversations-list/conversations-list-item';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseInfiniteQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {SvgImage} from '@ui/images/svg-image';

export function Component() {
  const {agentId} = useRequiredParams(['agentId']);
  const query = useSuspenseInfiniteQuery(
    helpdeskQueries.conversations.agentConversationList(agentId),
  );
  const conversations = query.data?.pages.flatMap(p => p.pagination.data);

  if (query.data && !conversations?.length) {
    return (
      <IllustratedMessage
        className="mt-60"
        image={<SvgImage src={chatSvg} />}
        title={
          <Trans message="Agent did not have any conversations recently" />
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {conversations?.map(conversation => (
        <ConversationsListItem
          key={conversation.id}
          conversation={conversation}
          descriptionClassName="max-w-850"
        />
      ))}
      <InfiniteScrollSentinel query={query} />
    </div>
  );
}
