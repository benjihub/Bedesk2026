import {ConversationCategoryAttribute} from '@app/attributes/compact-attribute';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CreateTicketAsCustomerPayload} from '@app/help-center/tickets-portal/new-ticket-page/create-ticket-as-customer-payload';
import {CustomerNewTicketPageData} from '@app/help-center/tickets-portal/new-ticket-page/customer-new-ticket-page-data';
import {CategoryField} from '@app/help-center/tickets-portal/new-ticket-page/form/category-field';
import {DescriptionField} from '@app/help-center/tickets-portal/new-ticket-page/form/description-field';
import {SubjectField} from '@app/help-center/tickets-portal/new-ticket-page/form/subject-field';
import {useCustomerNewTicketForm} from '@app/help-center/tickets-portal/new-ticket-page/form/use-customer-new-ticket-form';
import {useAuth} from '@common/auth/use-auth';
import {CaptchaContainer} from '@common/captcha/captcha-container';
import {useCaptcha} from '@common/captcha/use-captcha';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {getInputFieldClassNames} from '@ui/forms/input-field/get-input-field-class-names';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useNavigate} from 'react-router';

interface Props {
  data: CustomerNewTicketPageData;
}
export function TicketForm({data}: Props) {
  const {isLoggedIn} = useAuth();
  const navigate = useNavigate();
  const inputFieldClassNames = getInputFieldClassNames();
  const {captchaToken, captchaEnabled, resetCaptcha} = useCaptcha('new_ticket');

  const {
    form,
    attachments,
    searchQuery,
    searchTermLogger,
    hcCategoryIds,
    attributes,
  } = useCustomerNewTicketForm(data);
  const bodyError = form.formState.errors.message?.body?.message;

  const createTicket = useMutation({
    mutationFn: async (payload: CreateTicketAsCustomerPayload) => {
      return apiClient
        .post(`helpdesk/customer/tickets`, {
          ...payload,
          message: {
            ...payload.message,
            attachments: payload.message.attachments.map(a => a.id),
          },
          captcha_token: captchaToken,
        })
        .then(r => r.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
      });
      toast(message('Ticket created'));
      searchTermLogger.updateLastSearch({createdTicket: true});
      if (isLoggedIn) {
        navigate('/hc/tickets');
      } else {
        navigate('/hc');
      }
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
    <Form
      form={form}
      onSubmit={() => handleSubmit()}
      onBeforeSubmit={() => form.clearErrors()}
      className="overflow-x-hidden"
    >
      {!data.customerEmail && (
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
            <div key={attribute.id} className="mb-24">
              <div className={inputFieldClassNames.label}>
                <Trans message={attribute.name} />
              </div>
              <DescriptionField
                attachments={attachments}
                errorMessage={
                  bodyError && (
                    <div className={inputFieldClassNames.error}>
                      {bodyError}
                    </div>
                  )
                }
              />
            </div>
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
      <Button
        variant="flat"
        color="primary"
        type="submit"
        disabled={createTicket.isPending}
      >
        <Trans message={data.config.submitButtonText} />
      </Button>
    </Form>
  );
}
