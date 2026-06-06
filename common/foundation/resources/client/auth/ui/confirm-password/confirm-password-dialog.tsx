import {Dialog} from '@ui/overlays/dialog/dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {
  ConfirmPasswordPayload,
  useConfirmPassword,
} from '@common/auth/ui/confirm-password/requests/use-confirm-password';
import {useForm} from 'react-hook-form';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Trans} from '@ui/i18n/trans';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {Button} from '@ui/buttons/button';

export function ConfirmPasswordDialog() {
  const {close, formId} = useDialogContext();
  const form = useForm<ConfirmPasswordPayload>();
  const confirmPassword = useConfirmPassword(form);
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Confirm password" />
      </DialogHeader>
      <DialogBody>
        <p className="mb-16 text-sm">
          <Trans message="For your security, please confirm your password to continue." />
        </p>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            confirmPassword.mutate(values, {
              onSuccess: () => close(values.password),
            })
          }
        >
          <FormTextField
            name="password"
            label={<Trans message="Password" />}
            type="password"
            required
            autoFocus
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          variant="flat"
          color="primary"
          form={formId}
          disabled={confirmPassword.isPending}
        >
          <Trans message="Confirm" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
