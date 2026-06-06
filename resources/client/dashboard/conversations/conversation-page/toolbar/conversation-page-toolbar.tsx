import {FullConversationResponse} from '@app/dashboard/conversation';
import {ConversationSubject} from '@app/dashboard/conversations/conversation-page/toolbar/conversation-subject';
import {MoreOptionsButton} from '@app/dashboard/conversations/conversation-page/toolbar/more-options-button';
import {StatusButton} from '@app/dashboard/conversations/conversation-page/toolbar/status-button';
import {useToggleAiPause} from '@app/dashboard/conversations/conversation-page/toolbar/use-toggle-ai-pause';
import {useAgentInboxLayout} from '@app/dashboard/conversations/conversation-page/use-agent-inbox-layout';
import {
  ConversationTagManagerDialog,
  TagManagerItem,
  useAddTagToConversations,
  useRemoveTagFromConversations,
} from '@app/dashboard/conversations/conversations-table/conversation-actions/add-tag-to-conversations-button';
import {InboxSectionHeader} from '@app/dashboard/dashboard-layout/inbox-section-header';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {queryClient} from '@common/http/query-client';
import {DashboardLayoutContext} from '@common/ui/dashboard-layout/dashboard-layout-context';
import {IconButton} from '@ui/buttons/icon-button';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {SellIcon} from '@ui/icons/material/Sell';
import {PauseIcon} from '@ui/icons/material/Pause';
import {PlayArrowIcon} from '@ui/icons/material/PlayArrow';
import {ToggleLeftSidebarIcon} from '@ui/icons/toggle-left-sidebar-icon';
import {ToggleRightSidebarIcon} from '@ui/icons/toggle-right-sidebar-icon';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Trans} from '@ui/i18n/trans';
import {useKeybind} from '@ui/utils/keybinds/use-keybind';
import {useContext, useState} from 'react';
import {Link, useSearchParams} from 'react-router';

interface Props {
  data: FullConversationResponse;
}
export function ConversationPageToolbar({data}: Props) {
  const aiPaused = data.conversation.assigned_to !== 'bot';
  return (
    <InboxSectionHeader gap="gap-4">
      <ToggleConversationListButton />
      <div className="text-overflow-ellipsis mr-24 min-w-0 overflow-hidden">
        <ConversationSubject data={data} />
      </div>
      <AiPauseToggleButton
        conversationId={data.conversation.id}
        paused={aiPaused}
      />
      <MoreOptionsButton data={data} />
      <ManageTagsButton data={data} />
      <StatusButton data={data} />
      <ToggleRightSidebarButton />
    </InboxSectionHeader>
  );
}

interface AiPauseToggleButtonProps {
  conversationId: number;
  paused: boolean;
}

function AiPauseToggleButton({conversationId, paused}: AiPauseToggleButtonProps) {
  const toggleAiPause = useToggleAiPause();

  const handleClick = () => {
    toggleAiPause.mutate({
      conversationIds: [conversationId],
      pause: !paused,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleAiPause.isLoading}
      className={
        'inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ' +
        (paused
          ? 'border-danger text-danger bg-danger/5 hover:bg-danger/10'
          : 'border-success text-success bg-success/5 hover:bg-success/10')
      }
    >
      <span className="flex h-1.5 w-1.5 rounded-full bg-current" />
      {paused ? (
        <Trans message="AI paused" />
      ) : (
        <Trans message="AI active" />
      )}
    </button>
  );
}

export function ToggleConversationListButton() {
  const {toggleConversationList} = useAgentInboxLayout();
  const {isMobileMode} = useContext(DashboardLayoutContext);
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get('viewId') ?? 'all';

  if (isMobileMode) {
    return (
      <IconButton
        size="sm"
        elementType={Link}
        to={`/dashboard/conversations?viewId=${viewId}`}
      >
        <ArrowBackIcon />
      </IconButton>
    );
  }

  return (
    <IconButton size="xs" onClick={() => toggleConversationList()}>
      <ToggleLeftSidebarIcon />
    </IconButton>
  );
}

export function ToggleRightSidebarButton() {
  const {toggleRightSidebar, rightSidebarOpen: rightSidenavOpen} =
    useAgentInboxLayout();
  if (rightSidenavOpen) return null;
  return (
    <IconButton onClick={() => toggleRightSidebar()} size="xs">
      <ToggleRightSidebarIcon />
    </IconButton>
  );
}

interface ManageTagsButtonProps {
  data: FullConversationResponse;
}
export function ManageTagsButton({data}: ManageTagsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const attachedTags = data.tags.map(t => t.id);
  const addTag = useAddTagToConversations();
  const removeTag = useRemoveTagFromConversations();

  const invalidateConversation = () => {
    queryClient.invalidateQueries({
      queryKey: helpdeskQueries.conversations.get(data.conversation.id)
        .queryKey,
    });
  };

  useKeybind('window', 't', () => setIsOpen(true));

  return (
    <DialogTrigger
      type="popover"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClose={(tag: TagManagerItem) => {
        if (tag) {
          if (attachedTags.includes(tag.id)) {
            removeTag.mutate(
              {
                tagId: tag.id,
                conversationIds: [data.conversation.id],
              },
              {onSuccess: invalidateConversation},
            );
          } else {
            addTag.mutate(
              {
                tagId: tag.id,
                newTagName: tag.newTagName,
                conversationIds: [data.conversation.id],
              },
              {onSuccess: invalidateConversation},
            );
          }
        }
      }}
    >
      <IconButton className="mr-8" size="xs" iconSize="sm">
        <SellIcon />
      </IconButton>
      <ConversationTagManagerDialog attachedTags={attachedTags} />
    </DialogTrigger>
  );
}
