import {CannedReply} from '@app/canned-replies/canned-reply';
import {CreateCannedReplyDialog} from '@app/canned-replies/datatable/create-canned-reply-dialog';
import {useCannedReplies} from '@app/canned-replies/requests/use-canned-replies';
import {CreateCannedReplyPayload} from '@app/canned-replies/requests/use-create-canned-reply';
import {ActionMenuDialog} from '@app/dashboard/conversations/agent-reply-composer/action-menu-dialog';
import {AgentCannedReply} from '@app/dashboard/types/agent-canned-reply';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {BookmarkPlusIcon} from '@ui/icons/lucide/bookmark-plus';
import {AddIcon} from '@ui/icons/material/Add';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {Fragment, useState} from 'react';
import {Link} from 'react-router';

export interface InsertCannedReplyButtonProps {
  getInitialData?: () => Partial<CreateCannedReplyPayload>;
  onSelected: (reply: AgentCannedReply) => void;
}
export function InsertCannedReplyButton({
  getInitialData,
  onSelected,
}: InsertCannedReplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newReplyDialogIsOpen, setNewReplyDialogIsOpen] = useState(false);

  useKeybind(
    'window',
    'ctrl+k',
    () => {
      setIsOpen(true);
    },
    {allowedInputSelector: '.ProseMirror'},
  );

  return (
    <Fragment>
      <DialogTrigger
        type="modal"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        underlayTransparent={true}
        underlayBlurred={false}
        returnFocusToTrigger={false}
        onClose={(reply: AgentCannedReply) => {
          if (reply) {
            onSelected(reply);
          }
        }}
      >
        <Tooltip label={<Trans message="Saved replies (ctrl+k)" />}>
          <IconButton size="xs" iconSize="sm">
            <BookmarkPlusIcon />
          </IconButton>
        </Tooltip>
        <RepliesDialog
          onNewReplyDialogOpen={() => setNewReplyDialogIsOpen(true)}
        />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={newReplyDialogIsOpen}
        onOpenChange={setNewReplyDialogIsOpen}
      >
        <CreateCannedReplyDialog getInitialData={getInitialData} />
      </DialogTrigger>
    </Fragment>
  );
}

interface RepliesDialogProps {
  onNewReplyDialogOpen: () => void;
}
function RepliesDialog({onNewReplyDialogOpen}: RepliesDialogProps) {
  const [query, setQuery] = useState('');
  const {replies, isLoading, isFetching} = useCannedReplies(query);
  const {close} = useDialogContext();

  const actions = (
    <Fragment>
      <Tooltip label={<Trans message="Create new reply" />}>
        <IconButton
          onClick={() => {
            close();
            onNewReplyDialogOpen();
          }}
          className="ml-auto"
          variant="outline"
          size="xs"
          iconSize="sm"
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Tooltip label={<Trans message="Manage saved replies" />}>
        <IconButton
          elementType={Link}
          to={'/dashboard/saved-replies'}
          className="ml-8"
          variant="outline"
          size="xs"
          iconSize="sm"
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </Fragment>
  );

  return (
    <ActionMenuDialog
      placeholder={message('Search saved replies...')}
      query={query}
      onQueryChange={setQuery}
      isLoading={isLoading}
      isFetching={isFetching}
      data={replies}
      actions={actions}
      itemData={item => {
        item = item as CannedReply;
        return {
          title: item.name,
            description: item.shortcut
              ? `${item.shortcut} — ${item.description}`
              : item.description,
        };
      }}
    />
  );
}
