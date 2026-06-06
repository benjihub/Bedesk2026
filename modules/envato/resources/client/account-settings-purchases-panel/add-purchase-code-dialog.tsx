import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Button} from '@ui/buttons/button';
import {useAddPurchaseUsingCode} from '@envato/account-settings-purchases-panel/use-add-purchase-using-code';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';

interface Props {
  userId: number | string;
}
export function AddPurchaseCodeDialog({userId}: Props) {
  const form = useForm<{purchaseCode: string}>();
  const addPurchase = useAddPurchaseUsingCode(form);
  const {close, formId} = useDialogContext();
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Add purchase code" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            addPurchase.mutate(
              {userId, purchaseCode: values.purchaseCode},
              {onSuccess: () => close()},
            )
          }
        >
          <FormTextField
            name="purchaseCode"
            label={<Trans message="Purchase code" />}
            autoFocus
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => close()}>
          <Trans message="Close" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={addPurchase.isPending}
        >
          <Trans message="Add" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
