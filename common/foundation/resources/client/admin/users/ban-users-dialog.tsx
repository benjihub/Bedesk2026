import {
  CreateBanPayload,
  useBanUsers,
} from '@common/admin/users/requests/use-ban-users';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormDatePicker} from '@ui/forms/input-field/date/date-picker/date-picker';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';

interface Props {
  userIds: number[];
  description?: ReactNode;
  onSuccess?: () => void;
}
export function BanUsersDialog({userIds, description, onSuccess}: Props) {
  const {trans} = useTrans();
  const {close, formId} = useDialogContext();
  const form = useForm<CreateBanPayload>({
    defaultValues: {
      permanent: true,
    },
  });
  const isPermanent = form.watch('permanent');
  const banUser = useBanUsers(form, userIds);
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Suspend users" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            banUser.mutate(values, {
              onSuccess: () => {
                close(true);
                onSuccess?.();
              },
            })
          }
        >
          <FormDatePicker
            name="ban_until"
            label={<Trans message="Suspend until" />}
            disabled={isPermanent}
          />
          <FormSwitch name="permanent" className="mt-12">
            <Trans message="Permanent" />
          </FormSwitch>
          <FormTextField
            className="mt-24"
            name="comment"
            inputElementType="textarea"
            maxLength={250}
            label={<Trans message="Reason" />}
            placeholder={trans(message('Optional'))}
          />
        </Form>
        {description && <div className="mt-16">{description}</div>}
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          form={formId}
          variant="flat"
          color="primary"
          type="submit"
          disabled={banUser.isPending}
        >
          <Trans message="Suspend" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
