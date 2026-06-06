import {FullConversationResponse} from '@app/dashboard/conversation';
import {ChangeCustomerDialog} from '@app/dashboard/conversations/conversation-page/change-customer-dialog';
import {TransferConversationDialog} from '@app/dashboard/conversations/conversation-page/transfer-conversation-dialog/transfer-conversation-dialog';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BanUsersDialog} from '@common/admin/users/ban-users-dialog';
import {useUnbanUsers} from '@common/admin/users/requests/use-unban-users';
import {queryClient} from '@common/http/query-client';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {ListIcon} from '@ui/icons/lucide/list-icon';
import {MessageSquareTextIcon} from '@ui/icons/lucide/message-square-text-icon';
import {UserPenIcon} from '@ui/icons/lucide/user-pen-icon';
import {BlockIcon} from '@ui/icons/material/Block';
import {DownloadIcon} from '@ui/icons/material/Download';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {MoveUpIcon} from '@ui/icons/material/MoveUp';
import {MultipleStopIcon} from '@ui/icons/material/MultipleStop';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {useSettings} from '@ui/settings/use-settings';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {Fragment, useState} from 'react';

interface Props {
  data: FullConversationResponse;
}
export function MoreOptionsButton({data: {user, conversation}}: Props) {
  const {base_url} = useSettings();
  if (!user) return null;

  const unbanUser = useUnbanUsers([user.id]);
  const {messagesLayout, setMessagesLayout} = useAgentInboxLayout();
  const [transferDialogIsOpen, setTransferDialogIsOpen] = useState(false);
  const [suspendUserIsOpen, setSuspendUserIsOpen] = useState(false);

  const downloadChatTranscript = (chatId: number | string) => {
    downloadFileFromUrl(
      `${base_url}/api/v1/lc/dashboard/chats/${chatId}/download-transcript`,
    );
  };

  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={transferDialogIsOpen}
        onOpenChange={setTransferDialogIsOpen}
      >
        <TransferConversationDialog 
          conversationIds={[conversation.id]} 
          conversations={[conversation]}
        />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={suspendUserIsOpen}
        onOpenChange={setSuspendUserIsOpen}
        onClose={async isSuspended => {
          if (isSuspended) {
            await queryClient.invalidateQueries({
              queryKey: ['conversations', `${conversation.id}`],
            });
          }
        }}
      >
        <BanUsersDialog
          userIds={[user.id]}
          description={
            <Trans message="Suspended users will not be able to start conversations, appear in the traffic list or receive campaigns." />
          }
        />
      </DialogTrigger>
      <MenuTrigger>
        <IconButton size="xs" iconSize="sm" className="ml-auto">
          <MoreVertIcon />
        </IconButton>
        <Menu>
          {conversation.type === 'chat' && (
            <Item
              value="downloadTranscript"
              startIcon={<DownloadIcon size="sm" />}
              onSelected={() => {
                downloadChatTranscript(conversation.id);
              }}
            >
              <Trans message="Download transcript" />
            </Item>
          )}
          <Item
            value="assign"
            onSelected={() => setTransferDialogIsOpen(true)}
            startIcon={<MoveUpIcon size="sm" />}
          >
            <Trans message="Transfer conversation" />
          </Item>
          <Item
            value="editUser"
            startIcon={<UserPenIcon size="sm" />}
            onSelected={() =>
              window.open(
                `${base_url}/dashboard/customers/${user.id}`,
                '_blank',
              )
            }
          >
            <Trans message="Edit customer" />
          </Item>
          {conversation.type === 'ticket' && (
            <Item
              value="changeCustomer"
              startIcon={<MultipleStopIcon size="sm" />}
              onSelected={() =>
                openDialog(ChangeCustomerDialog, {
                  conversationId: conversation.id,
                })
              }
            >
              <Trans message="Change customer" />
            </Item>
          )}
          <Item
            value="suspend"
            onSelected={() => {
              if (user.banned_at) {
                unbanUser.mutate(undefined, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: helpdeskQueries.conversations.get(
                        conversation.id,
                      ).queryKey,
                    });
                  },
                });
              } else {
                setSuspendUserIsOpen(true);
              }
            }}
            startIcon={<BlockIcon size="sm" />}
          >
            {user.banned_at ? (
              <Trans message="Unsuspend customer" />
            ) : (
              <Trans message="Suspend customer" />
            )}
          </Item>
          <Item
            value="messagesLayout"
            startIcon={
              messagesLayout === 'feed' ? (
                <ListIcon size="sm" />
              ) : (
                <MessageSquareTextIcon size="sm" />
              )
            }
            onSelected={() =>
              setMessagesLayout(messagesLayout === 'feed' ? 'list' : 'feed')
            }
          >
            {messagesLayout === 'feed' ? (
              <Trans message="Switch to list view" />
            ) : (
              <Trans message="Switch to feed view" />
            )}
          </Item>
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}
