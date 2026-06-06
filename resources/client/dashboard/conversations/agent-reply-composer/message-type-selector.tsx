import {useAgentReplyComposerStore} from '@app/dashboard/conversations/agent-reply-composer/agent-reply-composer-store';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {MessageSquareTextIcon} from '@ui/icons/lucide/message-square-text-icon';
import {StickyNoteIcon} from '@ui/icons/lucide/sticky-note-icon';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';

export function MessageTypeSelector() {
  const type = useAgentReplyComposerStore(s => s.messageType);
  const updateType = useAgentReplyComposerStore(s => s.setMessageType);
  return (
    <MenuTrigger
      placement="top"
      offset={8}
      selectedValue={type}
      selectionMode="single"
    >
      <Button
        size="xs"
        className="ml-4"
        startIcon={
          type === 'message' ? <MessageSquareTextIcon /> : <StickyNoteIcon />
        }
        endIcon={<KeyboardArrowDownIcon />}
      >
        {type === 'message' ? (
          <Trans message="Message" />
        ) : (
          <Trans message="Note" />
        )}
      </Button>
      <Menu>
        <Item
          value="message"
          onSelected={() => updateType('message')}
          startIcon={<MessageSquareTextIcon size="sm" />}
        >
          <Trans message="Message" />
        </Item>
        <Item
          value="note"
          onSelected={() => updateType('note')}
          startIcon={<StickyNoteIcon size="sm" />}
        >
          <Trans message="Note" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
