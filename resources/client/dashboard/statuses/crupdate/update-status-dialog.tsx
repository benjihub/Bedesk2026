import {CrupdateStatusFields} from '@app/dashboard/statuses/crupdate/crupdate-status-fields';
import {useUpdateStatus} from '@app/dashboard/statuses/crupdate/use-update-status';
import {Status} from '@app/dashboard/statuses/status';
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
  status: Status;
}
export function UpdateStatusDialog({status}: Props) {
  const {close, formId} = useDialogContext();
  const form = useForm<Status>({
    defaultValues: {
      label: status.label,
      user_label: status.user_label,
      category: status.category,
      active: status.active,
    },
  });

  const updateStatus = useUpdateStatus(status, form);

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Update status" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            updateStatus.mutate(values, {
              onSuccess: () => close(),
            });
          }}
        >
          <CrupdateStatusFields />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={updateStatus.isPending}
        >
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
