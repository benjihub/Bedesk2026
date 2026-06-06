import {
  UpdateConversationPayload,
  useUpdateConversation,
} from '@app/dashboard/conversations/conversation-page/requests/use-update-conversation';
import {FormNormalizedModelField} from '@common/ui/normalized-model/normalized-model-field';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm} from 'react-hook-form';

interface Props {
  conversationId: string | number;
}
export function ChangeCustomerDialog({conversationId}: Props) {
  const {close, formId} = useDialogContext();
  const form = useForm<UpdateConversationPayload>();
  const updateTicket = useUpdateConversation(conversationId, form);
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Change customer" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            updateTicket.mutate(values, {onSuccess: () => close()});
          }}
        >
          <FormNormalizedModelField
            required
            name="user_id"
            endpoint="normalized-models/user"
            label={<Trans message="New customer" />}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          form={formId}
          variant="flat"
          color="primary"
          disabled={updateTicket.isPending}
        >
          <Trans message="Change" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
