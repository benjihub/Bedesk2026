import {BackendDialogFields} from '@common/admin/settings/pages/uploading-settings/backends/backend-dialog-fields';
import {BackendFormValue} from '@common/admin/settings/pages/uploading-settings/backends/backends';
import {useValidateBackendCredentials} from '@common/admin/settings/pages/uploading-settings/backends/use-validate-backend-credentials';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {nanoid} from 'nanoid';
import {useForm} from 'react-hook-form';

export function CreateBackendDialog() {
  const {formId, close} = useDialogContext();
  const form = useForm<BackendFormValue>({
    defaultValues: {
      type: 'local',
      root: '',
      name: '',
      config: {},
    },
  });

  const validateBackend = useValidateBackendCredentials(form);

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Create backend" />
      </DialogHeader>
      <DialogBody>
        <Form
          disableNativeValidation
          id={formId}
          form={form}
          onSubmit={value => {
            const payload = {
              id: nanoid(10),
              ...value,
              config: value.config[value.type],
            };
            validateBackend.mutate(payload, {
              onSuccess: () => close(payload),
            });
          }}
        >
          <BackendDialogFields />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={validateBackend.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
