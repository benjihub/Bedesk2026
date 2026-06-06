import {FullConversationResponse} from '@app/dashboard/conversation';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {getConversationPageLink} from '@app/dashboard/conversations/utils/get-conversation-page-link';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import {useCallback} from 'react';
import {useSearchParams} from 'react-router';

export type AfterReplyAction = 'stay_on_page' | 'next_active' | 'back_to_view';

export function useAfterReplyAction(
  conversation: FullConversationResponse['conversation'],
) {
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('viewId');
  const navigate = useNavigate();
  const defaultAction: AfterReplyAction =
    conversation.type === 'ticket' && !conversation.ai_handoff_active ? 'next_active' : 'stay_on_page';
  // store it separately for chat and ticket
  const [action, setAction] = useLocalStorage<AfterReplyAction>(
    `after_reply_action.${conversation.type}`,
    defaultAction,
  );
  const {conversationListLayout} = useAgentInboxLayout();

  const perform = useCallback(async () => {
    const backToConversationList = () => {
      // can't go back to table view in chat layout mode
      if (conversationListLayout !== 'table') {
        return;
      }
      return navigate(`/dashboard/conversations?viewId=${viewId}`);
    };

    // if AI handoff is active force stay on page behavior regardless of stored action
    if (conversation.ai_handoff_active) {
      return;
    }

    if (action === 'next_active') {
      const data = await queryClient.ensureInfiniteQueryData(
        helpdeskQueries.conversations.infiniteIndex(
          Object.fromEntries(searchParams),
        ),
      );
      const conversations = data.pages[0].pagination.data ?? [];
      if (conversations.length > 0) {
        const currentIndex = conversations.findIndex(
          d => d.id === conversation.id,
        );
        const next = currentIndex > -1 ? conversations[currentIndex + 1] : null;
        if (next) {
          navigate(getConversationPageLink(next, {viewId}));
        } else {
          backToConversationList();
        }
      }
    } else if (action === 'back_to_view') {
      backToConversationList();
    }
  }, [
    action,
    viewId,
    navigate,
    conversation.id,
    searchParams,
    conversationListLayout,
    conversation.ai_handoff_active,
  ]);

  return {action, setAction, perform};
}

interface Props {
  disabled?: boolean;
  conversation: FullConversationResponse['conversation'];
}
export function AfterReplyActionSelector({disabled, conversation}: Props) {
  const {action, setAction} = useAfterReplyAction(conversation);
  return (
    <MenuTrigger
      selectionMode="single"
      selectedValue={action}
      onItemSelected={newValue => setAction(newValue as AfterReplyAction)}
      showCheckmark
    >
      <IconButton
        size="xs"
        iconSize="sm"
        variant="flat"
        color="primary"
        radius="rounded-r-button"
        disabled={disabled}
      >
        <KeyboardArrowDownIcon />
      </IconButton>
      <Menu>
        <Item value="stay_on_page">
          <Trans message="Send and stay on page" />
        </Item>
        <Item value="next_active">
          <Trans message="Send and next active" />
        </Item>
        <Item value="back_to_view">
          <Trans message="Send and back to view" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
