import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import {TicketsPortalConversationResponse} from '@app/help-center/tickets-portal/ticket-page/conversation-response';
import {ReplyList} from '@app/help-center/tickets-portal/ticket-page/reply-list';
import {TicketDetails} from '@app/help-center/tickets-portal/ticket-page/ticket-details';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {InsertInlineImageButton} from '@app/reply-composer/insert-inline-image-button';
import {ReplyComposerAttachments} from '@app/reply-composer/reply-composer-attachments';
import ReplyComposerContainer from '@app/reply-composer/reply-composer-container';
import {ReplyComposerDropTargetMask} from '@app/reply-composer/reply-composer-drop-target';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {UploadAttachmentsButton} from '@app/reply-composer/upload-attachments-button';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {TextEditorApi} from '@common/text-editor/tiptap-editor-provider';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {SectionHelper} from '@common/ui/other/section-helper';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useRef, useState} from 'react';

export function Component() {
  const {conversationId} = useRequiredParams(['conversationId']);
  const query = useSuspenseQuery(
    helpCenterQueries.customerConversations.get(conversationId),
  );

  return (
    <div className="flex h-screen flex-col">
      <Navbar
        menuPosition="header"
        className="customer-ticket-navbar flex-shrink-0"
      >
        <HcSearchBar />
      </Navbar>
      <div className="customer-ticket-page-layout container mx-auto flex-auto overflow-y-auto px-12 pb-48 md:gap-x-64 md:px-24">
        <PageBreadCrumb />
        <ConversationTitle data={query.data} />
        <ConversationContent data={query.data} />
        {query.data.conversation.status_category !== statusCategory.locked && (
          <FileUploadProvider>
            <ReplyComposer />
          </FileUploadProvider>
        )}
        <TicketDetails
          data={query.data}
          className="customer-ticket-details w-350 flex-shrink-0 self-start rounded-panel border px-20 py-10 max-lg:hidden"
        />
      </div>
    </div>
  );
}

function PageBreadCrumb() {
  const navigate = useNavigate();
  return (
    <Breadcrumb
      size="sm"
      className="customer-ticket-header mb-34 mt-34 flex-shrink-0 md:mb-48"
    >
      <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
        <Trans message="Help center" />
      </BreadcrumbItem>
      <BreadcrumbItem onSelected={() => navigate(`/hc/tickets`)}>
        <Trans message="Tickets" />
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Trans message="Current ticket" />
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

interface GridItemProps {
  data: TicketsPortalConversationResponse;
}
function ConversationTitle({data}: GridItemProps) {
  return (
    <div className="customer-ticket-title mb-44 flex items-center justify-between gap-12">
      <h1 className="text-2xl">{data.conversation.subject}</h1>
      {data.conversation.status_category > statusCategory.closed && (
        <MarkAsSolvedButton />
      )}
    </div>
  );
}

function ConversationContent({data}: GridItemProps) {
  return (
    <main className="customer-ticket-content compact-scrollbar mb-24 overflow-y-auto pr-12 stable-scrollbar">
      {data.conversation.status_category === statusCategory.locked && (
        <SectionHelper
          className="mb-44 text-center"
          color="danger"
          title={
            <Trans message="This ticket was locked due to inactivity. To reply, create a new ticket." />
          }
        />
      )}
      <ReplyList data={data} />
    </main>
  );
}

function ReplyComposer() {
  const {hasPermission} = useAuth();
  const {conversationId} = useRequiredParams(['conversationId']);
  const uploadsDisabled = !hasPermission('files.create');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<ConversationAttachment[]>([]);
  const editorApiRef = useRef<TextEditorApi | null>(null);

  const submitReply = useMutation({
    mutationFn: () =>
      apiClient
        .post(`helpdesk/customer/conversations/${conversationId}/messages`, {
          body,
          attachments: attachments?.map(a => a.id),
        })
        .then(r => r.data),
    onSuccess: async () => {
      editorApiRef.current?.clearContents();
      setAttachments([]);
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
      toast(message('Reply submitted'));
    },
    onError: err => showHttpErrorToast(err),
  });

  const onUpload = (attachment: ConversationAttachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const onRemoveAttachment = (attachment: ConversationAttachment) => {
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
  };

  return (
    <form
      className="customer-ticket-editor"
      onSubmit={e => {
        e.preventDefault();
        submitReply.mutate();
      }}
    >
      <div className="mb-6 text-sm font-semibold">
        <Trans message="Add to conversation" />
      </div>
      <ReplyComposerDropTargetMask
        isDisabled={uploadsDisabled}
        onUpload={onUpload}
      >
        <ReplyComposerContainer
          onChange={setBody}
          submitToClosestForm
          autoFocus={false}
          ref={editorApiRef}
        >
          <FloatingToolbar />
          <ReplyComposerAttachments
            className="mb-2 mt-24 px-12"
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
          <ReplyComposerFooter
            submitButtons={
              <Button
                type="submit"
                variant="flat"
                color="primary"
                size="xs"
                disabled={submitReply.isPending || !body.length}
                className="mr-4"
              >
                <Trans message="Send reply" />
              </Button>
            }
          >
            <ReplyComposerEmojiPickerButton />
            {!uploadsDisabled && (
              <UploadAttachmentsButton onUpload={onUpload} />
            )}
            {!uploadsDisabled && (
              <InsertInlineImageButton
                uploadType={UploadType.conversationImages}
              />
            )}
          </ReplyComposerFooter>
        </ReplyComposerContainer>
      </ReplyComposerDropTargetMask>
    </form>
  );
}

function MarkAsSolvedButton() {
  const {conversationId} = useRequiredParams(['conversationId']);
  const markAsSolved = useMutation({
    mutationFn: () =>
      apiClient.post(
        `helpdesk/customer/conversations/${conversationId}/mark-as-solved`,
      ),
    onSuccess: () => {
      toast(message('Ticket marked as solved'));
      navigate(`/hc/tickets`);
    },
    onError: err => showHttpErrorToast(err),
  });
  const navigate = useNavigate();

  return (
    <DialogTrigger type="modal">
      <Button size="xs" variant="outline" startIcon={<CheckIcon />}>
        <Trans message="Mark as solved" />
      </Button>
      {({close}) => (
        <ConfirmationDialog
          onConfirm={() => {
            markAsSolved.mutate(undefined, {
              onSuccess: () => close(),
            });
          }}
          isLoading={markAsSolved.isPending}
          title={<Trans message="Mark as solved" />}
          body={
            <Trans message="Are you sure you want to mark this ticket as solved?" />
          }
          confirm={<Trans message="Confirm" />}
        />
      )}
    </DialogTrigger>
  );
}
