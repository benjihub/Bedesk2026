import {
  CompactAttribute,
  ConversationCategoryAttribute,
} from '@app/attributes/compact-attribute';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {CreateTicketAsCustomerPayload} from '@app/help-center/tickets-portal/new-ticket-page/create-ticket-as-customer-payload';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {CategoryField} from '@app/help-center/tickets-portal/new-ticket-page/form/category-field';
import {SubjectField} from '@app/help-center/tickets-portal/new-ticket-page/form/subject-field';
import {useCustomerNewTicketForm} from '@app/help-center/tickets-portal/new-ticket-page/form/use-customer-new-ticket-form';
import {useUploadAttachments} from '@app/reply-composer/use-upload-attachments';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {CaptchaContainer} from '@common/captcha/captcha-container';
import {useCaptcha} from '@common/captcha/use-captcha';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {
  FileUploadProvider,
  useFileUploadStore,
} from '@common/uploads/uploader/file-upload-provider';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {WidgetScreenHeader} from '@livechat/widget/widget-screen-header';
import {widgetStore} from '@livechat/widget/widget-store';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {PaperclipIcon} from '@ui/icons/lucide/paperclip';
import {CloseIcon} from '@ui/icons/material/Close';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {FullPageLoader} from '@ui/progress/full-page-loader';
import {ProgressBar} from '@ui/progress/progress-bar';
import {toast} from '@ui/toast/toast';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import clsx from 'clsx';
import {useFormContext} from 'react-hook-form';
import {Link, useNavigate} from 'react-router';

export function NewTicketScreen() {
  const query = useSuspenseQuery(
    helpCenterQueries.customerConversations.newTicketPageData(),
  );
  return (
    <div className="relative flex min-h-0 flex-auto flex-col">
      <WidgetScreenHeader
        start={
          <IconButton elementType={Link} to="/">
            <KeyboardArrowLeftIcon />
          </IconButton>
        }
        label={<Trans message="New ticket" />}
      />
      <div className="compact-scrollbar h-full overflow-y-auto p-20">
        {!query.data ? <FullPageLoader /> : <TicketForm data={query.data} />}
      </div>
    </div>
  );
}

interface TicketFormProps {
  data: CustomerNewTicketPageData;
}
export function TicketForm({data}: TicketFormProps) {
  const navigate = useNavigate();
  const {captchaToken, captchaEnabled, resetCaptcha} = useCaptcha('new_ticket');

  const {
    form,
    attachments,
    searchQuery,
    searchTermLogger,
    attributes,
    hcCategoryIds,
  } = useCustomerNewTicketForm(data);

  const createTicket = useMutation({
    mutationFn: (payload: CreateTicketAsCustomerPayload) =>
      apiClient
        .post(`lc/widget/tickets`, {
          ...payload,
          message: {
            ...payload.message,
            attachments: payload.message.attachments.map(a => a.id),
          },
          captcha_token: captchaToken,
        })
        .then(r => r.data),
    onSuccess: async r => {
      searchTermLogger.updateLastSearch({createdTicket: true});
      await queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      });
      if (!widgetStore().activeConversationId) {
        widgetStore().setActiveConversationId(r.conversation.id);
        window.parent.postMessage(
          {
            source: 'livechat-widget',
            type: 'activeConversationChanged',
            conversationId: r.conversation.id,
          },
          '*',
        );
      }
      toast(message('Ticket created'));
      navigate(`/conversations/${r.conversation.id}`);
    },
    onError: err => {
      resetCaptcha();
      return onFormQueryError(err, form);
    },
  });

  const handleSubmit = async () => {
    if (captchaEnabled && !captchaToken) {
      toast.danger(message('Please solve the captcha challenge.'));
      return;
    }
    createTicket.mutate(form.getValues());
  };

  return (
    <Form form={form} onSubmit={handleSubmit}>
      {!data.customerHasVerifiedEmail && (
        <FormTextField
          name="email"
          type="email"
          label={<Trans message="Your email address" />}
          className="mb-24"
          required
        />
      )}
      {attributes.map(attribute => {
        if (!attribute) return null;
        if (attribute.key === 'category') {
          return (
            <CategoryField
              key={attribute.id}
              attribute={attribute as unknown as ConversationCategoryAttribute}
            />
          );
        }
        if (attribute.key === 'subject') {
          return (
            <SubjectField
              key={attribute.id}
              searchQuery={searchQuery}
              hcCategoryIds={hcCategoryIds}
              attribute={attribute}
            />
          );
        }
        if (attribute.key === 'description') {
          return (
            <FileUploadProvider key={attribute.id}>
              <DescriptionField
                attribute={attribute}
                attachments={attachments}
              />
            </FileUploadProvider>
          );
        }
        return (
          <AttributeInputRenderer
            key={attribute.id}
            formPrefix="attributes"
            attribute={attribute}
            className="mb-24"
          />
        );
      })}
      {captchaEnabled && <CaptchaContainer className="mb-24" />}
      <div className="flex flex-col items-center gap-8">
        <Button
          variant="flat"
          color="primary"
          type="submit"
          disabled={createTicket.isPending}
          className="min-w-140"
        >
          <Trans message={data.config.submitButtonText} />
        </Button>
        <Button elementType={Link} to="/">
          <Trans message="Cancel" />
        </Button>
      </div>
    </Form>
  );
}

interface DescriptionFieldProps {
  attribute: CompactAttribute;
  attachments: ConversationAttachment[];
}
function DescriptionField({attribute, attachments}: DescriptionFieldProps) {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const progress = useFileUploadStore(
    s =>
      [...s.fileUploads.entries()]
        .filter(([_, upload]) => upload.status === 'inProgress')
        .map(([_, upload]) => upload.percentage)
        .reduce((a, b) => a + b, 0) / 100,
  );
  const form = useFormContext<CreateTicketAsCustomerPayload>();
  const upload = useUploadAttachments({
    onSuccess: entry => {
      form.setValue(
        'message.attachments',
        [entry, ...form.getValues('message.attachments')],
        {
          shouldDirty: true,
        },
      );
    },
  });
  return (
    <div className="mb-24">
      <FormTextField
        name="message.body"
        inputElementType="textarea"
        label={<Trans message={attribute.name} />}
        rows={3}
      />
      {progress ? <ProgressBar value={progress} size="xs" /> : null}
      {!uploadsDisabled ? (
        <Button
          size="2xs"
          variant="outline"
          className="mt-10"
          startIcon={<PaperclipIcon />}
          onClick={async () => {
            const restrictions = restrictionsFromConfig({
              uploadType: UploadType.conversationAttachments,
            });
            const files = await openUploadWindow({
              multiple: true,
              types: restrictions?.allowedFileTypes,
            });
            if (files.length) {
              upload(files);
            }
          }}
        >
          <Trans message="Attach files" />
        </Button>
      ) : null}
      <div className="mt-12 flex flex-wrap items-center gap-8">
        {attachments.map(attachment => (
          <Attachment
            key={attachment.id}
            name={attachment.name}
            onRemove={() => {
              form.setValue(
                'message.attachments',
                attachments.filter(a => a.id !== attachment.id),
                {shouldDirty: true},
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface AttachmentProps {
  name: string;
  onRemove: () => void;
}
const Attachment = ({name, onRemove}: AttachmentProps) => {
  return (
    <div
      className={clsx(
        'flex min-h-30 w-max flex-shrink-0 items-center gap-6 rounded-button border pl-8',
      )}
    >
      <div className="max-w-124 overflow-hidden overflow-ellipsis whitespace-nowrap text-xs font-bold text-muted">
        {name}
      </div>
      <IconButton onClick={() => onRemove()} size="xs" className="text-muted">
        <CloseIcon />
      </IconButton>
    </div>
  );
};
