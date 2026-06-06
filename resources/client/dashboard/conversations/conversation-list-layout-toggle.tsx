import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {DashboardIcon} from '@ui/icons/material/Dashboard';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useParams} from 'react-router';

interface Props {
  className?: string;
  size?: 'xs' | 'sm';
}
export function ConversationListLayoutToggle({className, size = 'xs'}: Props) {
  const {conversationId} = useParams();
  const {conversationListLayout, setConversationListLayout} =
    useAgentInboxLayout();

  return (
    <MenuTrigger
      showCheckmark
      selectionMode="single"
      selectedValue={conversationListLayout}
      onSelectionChange={newLayout => {
        setConversationListLayout(newLayout as 'chat' | 'table');

        if (newLayout === 'chat' && !conversationId) {
          window.location.reload();
        } else if (newLayout === 'table' && conversationId) {
          window.location.replace(`/dashboard/conversations`);
        }
      }}
    >
      <IconButton className={className} size={size}>
        <DashboardIcon />
      </IconButton>
      <Menu>
        <Item value="chat">
          <Trans message="Chat layout" />
        </Item>
        <Item value="table">
          <Trans message="Table layout" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
