import {UploadType} from '@app/site-config';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {FormImageSelector} from '@common/uploads/components/image-selector';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {useForm} from 'react-hook-form';
import {FileUploadProvider} from '../../uploads/uploader/file-upload-provider';
import {CreateUserPayload, useCreateUser} from './requests/create-user';

export function CreateUserDialog() {
  const form = useForm<CreateUserPayload>();
  const createUser = useCreateUser(form);
  const navigate = useNavigate();
  const {close, formId} = useDialogContext();

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Create user" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            createUser.mutate(values, {
              onSuccess: r => {
                close();
                navigate(`${r.user.id}`, {replace: true});
              },
            });
          }}
        >
          <FileUploadProvider>
            <FormImageSelector
              className="mb-24"
              name="image"
              uploadType={UploadType.avatars}
              label={<Trans message="Avatar" />}
              showRemoveButton
            />
          </FileUploadProvider>
          <FormTextField
            required
            className="mb-24"
            name="email"
            type="email"
            label={<Trans message="Email" />}
          />
          <FormTextField
            className="mb-24"
            name="name"
            label={<Trans message="Name" />}
          />
          <FormTextField
            required
            name="password"
            type="password"
            label={<Trans message="Password" />}
          />
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
          disabled={createUser.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
