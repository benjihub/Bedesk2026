import {BackendDialogFields} from '@common/admin/settings/pages/uploading-settings/backends/backend-dialog-fields';
import {BackendFormValue} from '@common/admin/settings/pages/uploading-settings/backends/backends';
import {useValidateBackendCredentials} from '@common/admin/settings/pages/uploading-settings/backends/use-validate-backend-credentials';
import {UploadingBackendSettings} from '@common/core/settings/base-backend-settings';
import {SectionHelper} from '@common/ui/other/section-helper';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm} from 'react-hook-form';

type Props = {
  backend: UploadingBackendSettings;
};
export function UpdateBackendDialog({backend}: Props) {
  const {formId, close} = useDialogContext();
  const form = useForm<BackendFormValue>({
    defaultValues: {
      type: backend.type,
      name: backend.name,
      root: backend.root,
      domain: backend.domain,
      config: backend.config
        ? {
            [backend.type]: backend.config,
          }
        : undefined,
    },
  });

  const validateBackend = useValidateBackendCredentials(form);

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Update backend" />
      </DialogHeader>
      <DialogBody>
        <SectionHelper
          className="mb-34"
          color="danger"
          description={
            <Trans message="Changing type, path, host or bucket settings will make files previosuly uploaded to this backend unavailable. Consider creating a new backend instead." />
          }
        />
        <Form
          disableNativeValidation
          id={formId}
          form={form}
          onBeforeSubmit={() => form.clearErrors()}
          onSubmit={value => {
            const payload: UploadingBackendSettings = {
              ...value,
              id: backend.id,
              config: value.config?.[value.type],
            };
            validateBackend.mutate(payload, {
              onSuccess: () => {
                close(payload);
              },
            });
          }}
        >
          <BackendDialogFields />
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
          disabled={validateBackend.isPending}
        >
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
