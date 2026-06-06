import {useCompactAgents} from '@livechat/widget/agents/use-widget-compact-agents';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {useTrans} from '@ui/i18n/use-trans';
import {EditIcon} from '@ui/icons/material/Edit';
import {EmailIcon} from '@ui/icons/material/Email';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {useState} from 'react';
import {useParams} from 'react-router';

export function AskForEmailForm() {
  const {agents, isLoading} = useCompactAgents();
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const visitor = useWidgetCustomer();
  const [formVisible, setFormVisible] = useState(!visitor?.email);

  // if agents are still loading don't show the form to prevent flashing
  if (
    (isLoading || agents.some(a => a.wasActiveRecently)) &&
    !isAppearanceEditorActive
  ) {
    return null;
  }

  return (
    <div className="mt-6 h-36">
      {isAppearanceEditorActive || formVisible || !visitor?.email ? (
        <EmailForm onSaved={() => setFormVisible(false)} />
      ) : (
        <EmailPreview
          email={visitor.email}
          onEdit={() => setFormVisible(true)}
        />
      )}
    </div>
  );
}

interface EmailFormProps {
  onSaved: () => void;
}
function EmailForm({onSaved}: EmailFormProps) {
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  const updateVisitorEmail = useSubmitWidgetCustomerEmail();
  const visitor = useWidgetCustomer();
  const {chatId} = useParams();
  const {trans} = useTrans();

  return (
    <form
      onSubmit={e => {
        e.preventDefault();

        if (isAppearanceEditorActive || !visitor) return;

        const email = new FormData(e.target as HTMLFormElement).get(
          'email',
        ) as string;
        if (email) {
          if (email === visitor.email) {
            onSaved();
          } else {
            updateVisitorEmail.mutate(
              {
                email,
                userId: visitor.id,
                conversationId: chatId,
              },
              {onSuccess: () => onSaved()},
            );
          }
        }
      }}
    >
      <TextField
        required
        type="email"
        name="email"
        size="sm"
        background="bg"
        defaultValue={visitor?.email}
        startAdornment={<EmailIcon />}
        placeholder={trans({message: 'Email'})}
        endAppend={
          <IconButton
            variant="flat"
            color="primary"
            type="submit"
            className="max-w-36"
            disabled={updateVisitorEmail.isPending}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        }
      />
    </form>
  );
}

interface EmailPreviewProps {
  email: string;
  onEdit: () => void;
}
function EmailPreview({email, onEdit}: EmailPreviewProps) {
  return (
    <Button
      size="xs"
      variant="outline"
      startIcon={<EditIcon />}
      className="my-3"
      onClick={() => onEdit()}
    >
      {email}
    </Button>
  );
}

interface Payload {
  email: string;
  userId: number;
  conversationId: number | string | undefined;
}
function useSubmitWidgetCustomerEmail() {
  return useMutation({
    mutationFn: ({email, conversationId}: Payload) => {
      return apiClient
        .put(`lc/widget/customers/email`, {
          email,
          conversationId,
        })
        .then(r => r.data);
    },
    onSuccess: () => {
      return Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: widgetQueries.conversations.invalidateKey,
        }),
        queryClient.invalidateQueries({
          queryKey: widgetQueries.customers.invalidateKey,
        }),
      ]);
    },
    onError: err => showHttpErrorToast(err),
  });
}
