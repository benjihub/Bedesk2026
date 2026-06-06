import {useUpdateConversation} from '@app/dashboard/conversations/conversation-page/requests/use-update-conversation';
import {CompactAttribute} from '@app/attributes/compact-attribute';
import {AttributeInputRenderer} from '@app/attributes/rendering/attribute-input-renderer';
import {getDefaultValuesForFormWithAttributes} from '@app/attributes/utils/get-default-values-for-form-with-attributes';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {toast} from '@ui/toast/toast';
import {useForm} from 'react-hook-form';

interface Props {
  attributes: CompactAttribute[];
  conversation: {id: number; model_type: string};
}
export function EditConversationAttributesDialog({
  attributes,
  conversation,
}: Props) {
  const {close, formId} = useDialogContext();
  const form = useForm({
    defaultValues: getDefaultValuesForFormWithAttributes(attributes),
  });
  const updateConversation = useUpdateConversation(conversation.id);

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Edit attributes" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            updateConversation.mutate(
              {
                attributes: values,
              },
              {
                onSuccess: () => {
                  toast(message('Attributes updated'));
                  close();
                },
              },
            )
          }
        >
          <div className="space-y-24">
            {attributes.map(attribute => (
              <AttributeInputRenderer
                key={attribute.id}
                attribute={attribute}
              />
            ))}
          </div>
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          color="primary"
          variant="flat"
          form={formId}
          disabled={updateConversation.isPending}
        >
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
