import {ConversationActionButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/conversation-action-button';
import {useChangeConversationStatus} from '@app/dashboard/conversations/conversations-table/conversation-actions/requests/use-change-conversation-status';
import {StatusColorDot} from '@app/dashboard/conversations/utils/get-status-color';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {FlagIcon} from '@ui/icons/material/Flag';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {toast} from '@ui/toast/toast';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useState} from 'react';

interface Props {
  conversationIds: number[];
  onSuccess?: () => void;
}
export function ChangeStatusButton({conversationIds, onSuccess}: Props) {
  const changeStatus = useChangeConversationStatus();
  const query = useQuery(helpdeskQueries.statuses.dropdownList('agent'));
  const [isOpen, setIsOpen] = useState(false);
  useKeybind('window', 's', () => setIsOpen(true));

  return (
    <MenuTrigger
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onItemSelected={newStatus =>
        changeStatus.mutate(
          {conversationIds, statusId: newStatus as number},
          {
            onSuccess: () => {
              onSuccess?.();
              toast(message('Status changed'));
            },
          },
        )
      }
    >
      <ConversationActionButton
        startIcon={<FlagIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        disabled={changeStatus.isPending}
      >
        <Trans message="Status (s)" />
      </ConversationActionButton>
      <Menu>
        {query.data?.statuses.map(status => (
          <Item
            key={status.id}
            value={status.id}
            startIcon={<StatusColorDot category={status.category} />}
          >
            <Trans message={status.label} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
