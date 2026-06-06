import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateStatusFields} from '@app/dashboard/statuses/crupdate/crupdate-status-fields';
import {Status} from '@app/dashboard/statuses/status';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
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

export function CreateStatusDialog() {
  const {close, formId} = useDialogContext();
  const form = useForm<Status>({
    defaultValues: {
      category: statusCategory.open,
    },
  });

  const createStatus = useMutation({
    mutationFn: (payload: Partial<Status>) =>
      apiClient.post(`helpdesk/statuses`, payload),
    onSuccess: () => {
      toast(message('Status created'));
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.statuses.invalidateKey,
      });
      close();
    },
    onError: err => onFormQueryError(err, form),
  });

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Create status" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            createStatus.mutate(values);
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
          disabled={createStatus.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
