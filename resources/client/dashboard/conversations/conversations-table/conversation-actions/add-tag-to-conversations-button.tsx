import {ConversationTag} from '@app/dashboard/conversation';
import {ActionMenuDialog} from '@app/dashboard/conversations/agent-reply-composer/action-menu-dialog';
import {ConversationActionButton} from '@app/dashboard/conversations/conversations-table/conversation-actions/conversation-action-button';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient} from '@common/http/query-client';
import {useMutation, useQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {PushPinIcon} from '@ui/icons/material/PushPin';
import {SellIcon} from '@ui/icons/material/Sell';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useState} from 'react';

export interface TagManagerItem extends ConversationTag {
  newTagName?: string;
}

interface ManageTagsPayload {
  tagId?: number;
  newTagName?: string;
  conversationIds: (number | string)[];
}

interface Props {
  conversationIds: number[];
  onSuccess: () => void;
  className?: string;
}
export function AddTagToConversationsButton({
  conversationIds,
  onSuccess,
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  useKeybind('window', 't', () => setIsOpen(true));
  const addTag = useAddTagToConversations();

  return (
    <DialogTrigger
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClose={(tag: TagManagerItem) => {
        if (tag) {
          addTag.mutate(
            {
              tagId: tag.id,
              newTagName: tag.newTagName,
              conversationIds,
            },
            {onSuccess},
          );
        }
      }}
      type="popover"
    >
      <ConversationActionButton
        startIcon={<SellIcon />}
        isCompact={false}
        className={className}
      >
        <Trans message="Tags (t)" />
      </ConversationActionButton>
      <ConversationTagManagerDialog />
    </DialogTrigger>
  );
}

interface ConversationTagManagerDialogProps {
  attachedTags?: number[];
}
export function ConversationTagManagerDialog({
  attachedTags,
}: ConversationTagManagerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const {trans} = useTrans();

  const query = useQuery(helpdeskQueries.tags.index(searchTerm));
  const tags = (query.data?.pagination.data || []) as TagManagerItem[];

  if (!query.isLoading && !tags.length && searchTerm) {
    tags.push({
      id: 0,
      newTagName: searchTerm,
      name: trans(message('Create tag ":name"', {values: {name: searchTerm}})),
    });
  }

  return (
    <ActionMenuDialog
      placeholder={message('Find tags..')}
      query={searchTerm}
      onQueryChange={setSearchTerm}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      data={tags}
      itemData={item => {
        item = item as TagManagerItem;
        return {
          title: item.name,
          startIcon: <PushPinIcon size="xs" />,
          selected: attachedTags?.includes(item.id),
        };
      }}
    />
  );
}

export function useRemoveTagFromConversations() {
  return useMutation({
    mutationFn: (payload: ManageTagsPayload) =>
      apiClient.post(`helpdesk/conversations/tags/remove`, payload),
  });
}

export function useAddTagToConversations() {
  return useMutation({
    mutationFn: (payload: ManageTagsPayload) =>
      apiClient.post(`helpdesk/conversations/tags/add`, payload),
  });
}
