import {MessageActionsDialog} from '@app/dashboard/conversations/conversation-page/messages/actions/message-actions-dialog';
import {
  ConversationMessage,
  PlaceholderConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FeedAttachments} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-attachments';
import {FeedBubble} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-bubble';
import {
  AiAgentNamePrefix,
  FeedMessageLayout,
} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-message-layout';
import {FormattedMessageBody} from '@app/dashboard/conversations/conversation-page/messages/formatted-message-body';
import {DeleteAttachmentDialog} from '@app/dashboard/conversations/conversation-page/messages/list/message-attachments';
import {MessageAvatar} from '@app/dashboard/conversations/conversation-page/messages/message-avatar';
import {MessageButtonsPreview} from '@app/dashboard/conversations/conversation-page/messages/message-buttons-preview';
import {MessageDate} from '@app/dashboard/conversations/conversation-page/messages/message-date';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {BulletSeparatedItems} from '@common/ui/other/bullet-seprated-items';
import {FilePreviewContainer} from '@common/uploads/components/file-preview/file-preview-container';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {VisibilityOffIcon} from '@ui/icons/material/VisibilityOff';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog, useDialogStore} from '@ui/overlays/store/dialog-store';
import clsx from 'clsx';
import {Fragment, ReactNode, useState} from 'react';
import {FileEntryUrlsContext} from '@common/uploads/file-entry-urls';
import {BankProofCard} from '@app/dashboard/conversations/conversation-page/messages/bank-proof-card';

interface Props {
  message: ConversationMessage | PlaceholderConversationMessage;
  isLastInGroup?: boolean;
}
export function DashboardFeedMessage({message, isLastInGroup}: Props) {
  const color = message.author === 'user' ? 'chip' : 'primary';
  const align = message.author === 'user' ? 'left' : 'right';
  const isPlaceholderMessage = 'is_placeholder' in message;
  const [actionsOpen, setActionsOpen] = useState(false);

  const bubble =
    message.body || !!message.data?.buttons?.length ? (
      <FeedBubble color={message.type === 'note' ? 'note' : color} allowBreak>
        <FormattedMessageBody addParagraphSpacing={message.author === 'bot'}>
          {message.body}
        </FormattedMessageBody>
        {message.author === 'user' && message.data?.ai_user_id?.verified && (
          <div className="mt-4 text-[11px] font-semibold uppercase text-green-600 dark:text-green-400">
            verified
          </div>
        )}
        {!!message.data?.buttons?.length && (
          <MessageButtonsPreview
            className="mt-8"
            buttons={message.data?.buttons}
          />
        )}
      </FeedBubble>
    ) : null;

  const content =
    !isPlaceholderMessage && bubble ? (
      <HoverDialogTrigger
        align={align}
        onOpenActions={() => setActionsOpen(true)}
      >
        {bubble}
      </HoverDialogTrigger>
    ) : (
      bubble
    );

  // need to lift MessageActionsDialog above FeedMessage, otherwise it will get closed on hover out
  return (
    <Fragment>
      {!isPlaceholderMessage && (
        <DialogTrigger
          type="modal"
          isOpen={actionsOpen}
          onOpenChange={setActionsOpen}
          underlayTransparent
          underlayBlurred={false}
          returnFocusToTrigger={false}
        >
          <MessageActionsDialog message={message} />
        </DialogTrigger>
      )}
      <FeedMessageLayout
        maxWidth="max-w-[min(86%,548px)]"
        align={align}
        avatar={<MessageAvatar message={message} size="sm" />}
        avatarInvisible={!isLastInGroup}
        className={clsx(isLastInGroup ? 'mb-12' : 'mb-4')}
        footer={
          isLastInGroup ? (
            <BulletSeparatedItems>
              {message.author === 'bot' && <AiAgentNamePrefix />}
              {message.created_at && (
                <time>
                  <MessageDate date={message.created_at} />
                </time>
              )}
              {message.type === 'note' && <NoteIndicator />}
            </BulletSeparatedItems>
          ) : undefined
        }
      >
        {content}
        {!!message.data?.bank_proof && (
          <BankProofCard data={message.data.bank_proof} messageId={message.id} />
        )}
        {!message.data?.bank_proof &&
          !!message.attachments?.some(a => a.mime?.startsWith('image/')) && (
            <div className="mt-8 text-[11px] text-muted">
              <Trans message="Analyzing transfer proof…" />
            </div>
          )}
        {!!message.attachments?.length && (
          <FeedAttachments
            align={align}
            attachments={message.attachments}
            color={message.author === 'user' ? 'chip' : 'primary'}
            onSelected={file => {
              openDialog(AttachmentPreviewDialog, {
                attachments: message.attachments,
                activeIndex: message.attachments.findIndex(
                  f => f.id === file.id,
                ),
                messageId: message.id,
              });
            }}
          />
        )}
      </FeedMessageLayout>
    </Fragment>
  );
}

function NoteIndicator() {
  return (
    <div className="inline-flex items-center">
      <div className="mx-6">•</div>
      <VisibilityOffIcon size="2xs" />
      <div className="ml-4 text-xs text-muted">
        <Trans message="Internal note" />
      </div>
    </div>
  );
}

interface HoverDialogTriggerProps {
  children: ReactNode;
  align: 'left' | 'right';
  onOpenActions: () => void;
}
function HoverDialogTrigger({
  children,
  onOpenActions,
  align,
}: HoverDialogTriggerProps) {
  return (
    <DialogTrigger
      type="popover"
      mobileType="popover"
      placement={align === 'right' ? 'bottom-start' : 'bottom-end'}
      offset={{
        mainAxis: -20,
        crossAxis: align === 'right' ? -10 : 10,
      }}
      triggerOnHover
      moveFocusToDialog={false}
      returnFocusToTrigger={false}
    >
      {children}
      <div
        role="dialog"
        tabIndex={-1}
        aria-modal
        className="overflow-hidden rounded-full border bg shadow-2xl"
      >
        <ActionsTriggerButton onClick={() => onOpenActions()} />
      </div>
    </DialogTrigger>
  );
}

interface ActionsTriggerButtonProps {
  onClick: () => void;
}
function ActionsTriggerButton({onClick}: ActionsTriggerButtonProps) {
  const {close} = useDialogContext();
  return (
    <IconButton
      size="xs"
      iconSize="sm"
      onClick={() => {
        // close parent hover dialog
        close();
        // open actions dialog
        onClick();
      }}
    >
      <MoreHorizIcon />
    </IconButton>
  );
}

interface AttachmentPreviewDialogProps {
  attachments: ConversationAttachment[];
  activeIndex: number;
  messageId: number;
}
function AttachmentPreviewDialog({
  attachments,
  activeIndex,
  messageId,
}: AttachmentPreviewDialogProps) {
  const attachmentId = attachments[activeIndex].id;
  const close = useDialogStore(s => s.closeActiveDialog);
  return (
    <Dialog
      size="fullscreenTakeover"
      background="bg-alt"
      className="flex flex-col"
    >
      <FileEntryUrlsContext.Provider value={{policy: 'conversationFileEntry'}}>
        <FilePreviewContainer
          entries={attachments}
          defaultActiveIndex={activeIndex}
          onClose={() => close()}
          headerActionsLeft={
            <DialogTrigger type="modal">
              <Button startIcon={<DeleteIcon />}>
                <Trans message="Delete" />
              </Button>
              <DeleteAttachmentDialog
                messageId={messageId}
                attachmentId={attachmentId}
                attachments={attachments}
                onSuccess={() => close()}
              />
            </DialogTrigger>
          }
        />
      </FileEntryUrlsContext.Provider>
    </Dialog>
  );
}
