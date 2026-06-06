import {FullConversationResponse} from '@app/dashboard/conversation';
import {useAfterReplyAction} from '@app/dashboard/conversations/agent-reply-composer/after-reply-action';
import {useChangeConversationStatus} from '@app/dashboard/conversations/conversations-table/conversation-actions/requests/use-change-conversation-status';
import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {
  getStatusColor,
  StatusColorDot,
} from '@app/dashboard/conversations/utils/get-status-color';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ArrowUpwardIcon} from '@ui/icons/material/ArrowUpward';
import {CloseIcon} from '@ui/icons/material/Close';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {Fragment, useEffect, useRef, useState} from 'react';

interface Props {
  data: FullConversationResponse;
}
export function StatusButton({data}: Props) {
  if (data.conversation.type === 'chat') {
    return <ChatStatusButton data={data} />;
  }

  return <TicketStatusButton data={data} />;
}

function ChatStatusButton({data}: Props) {
  const changeStatus = useChangeConversationStatus();
  const [confirmCloseIsOpen, setConfirmCloseIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useKeybind('window', 's', () => buttonRef.current?.click());

  const button =
    data.conversation.status_category <= statusCategory.closed ? (
      <Button
        ref={buttonRef}
        variant="flat"
        color="primary"
        size="xs"
        startIcon={<ArrowUpwardIcon />}
        disabled={changeStatus.isPending}
        onClick={() =>
          changeStatus.mutate({
            conversationIds: [data.conversation.id],
            statusName: 'open',
          })
        }
      >
        <Trans message="Re-open" />
      </Button>
    ) : (
      <Button
        ref={buttonRef}
        onClick={() => setConfirmCloseIsOpen(true)}
        variant="flat"
        color="primary"
        size="xs"
        startIcon={<CloseIcon />}
      >
        <Trans message="Close" />
      </Button>
    );

  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={confirmCloseIsOpen}
        onOpenChange={setConfirmCloseIsOpen}
      >
        <CloseChatDialog data={data} />
      </DialogTrigger>
      {button}
    </Fragment>
  );
}

function TicketStatusButton({data}: Props) {
  const {perform: afterReplyAction} = useAfterReplyAction(data.conversation);
  const statusQuery = useQuery(helpdeskQueries.statuses.dropdownList('agent'));
  // Notify if statuses fail to load so operators know why the dropdown is empty.
  useEffect(() => {
    if (statusQuery.isError) {
      toast(message('Failed to load conversation statuses'));
    }
  }, [statusQuery.isError]);
  const status = statusQuery.data?.statuses.find(
    status => status.id === data.conversation.status_id,
  );
  const changeStatus = useChangeConversationStatus({
    onSuccessAction: afterReplyAction,
  });

  const [isOpen, setIsOpen] = useState(false);
  useKeybind('window', 's', () => setIsOpen(true));

  const selectedLabel = status?.label ?? 'Open';

  return (
    <MenuTrigger
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      selectionMode="single"
      selectedValue={data.conversation.status_id}
      onItemSelected={newStatus => {
        changeStatus.mutate(
          {
            conversationIds: [data.conversation.id],
            statusId: newStatus as number,
          },
          {
            onSuccess: () => {
              toast(message('Status changed'));
            },
          },
        );
      }}
    >
      <Button
        variant="flat"
        color={getStatusColor(status?.category ?? statusCategory.open).button}
        size="xs"
        endIcon={<KeyboardArrowDownIcon />}
        className="capitalize"
        fontWeight="font-bold"
        disabled={statusQuery.isLoading || statusQuery.isError}
      >
        <Trans message={selectedLabel} />
      </Button>
      <Menu>
        {statusQuery.data?.statuses?.map(status => (
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

interface CloseChatDialogProps {
  data: FullConversationResponse;
}
function CloseChatDialog({data}: CloseChatDialogProps) {
  const changeStatus = useChangeConversationStatus();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={changeStatus.isPending}
      title={<Trans message="Close chat" />}
      confirm={<Trans message="Close" />}
      body={
        <Trans
          message="Are you sure you want to close the chat with :user?"
          values={{
            user: (
              <strong>
                <CustomerName user={data.user} className="inline" />
              </strong>
            ),
          }}
        />
      }
      onConfirm={() => {
        changeStatus.mutate(
          {conversationIds: [data.conversation.id], statusName: 'closed'},
          {onSuccess: () => close()},
        );
      }}
    />
  );
}
