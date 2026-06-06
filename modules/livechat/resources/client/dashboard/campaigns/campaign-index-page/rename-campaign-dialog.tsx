import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {useUpdateCampaign} from '@livechat/dashboard/campaigns/use-update-campaign';
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

interface Props {
  campaign: Campaign;
}
export function RenameCampaignDialog({campaign}: Props) {
  const {formId, close} = useDialogContext();
  const form = useForm<{name: string}>({
    defaultValues: {
      name: campaign.name,
    },
  });
  const updateCampaign = useUpdateCampaign(campaign.id);

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Rename campaign" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values =>
            updateCampaign.mutate(values, {onSuccess: () => close()})
          }
        >
          <FormTextField
            required
            name="name"
            autoFocus
            label={<Trans message="Name" />}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          disabled={updateCampaign.isPending}
          variant="flat"
          color="primary"
          form={formId}
        >
          <Trans message="Rename" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
