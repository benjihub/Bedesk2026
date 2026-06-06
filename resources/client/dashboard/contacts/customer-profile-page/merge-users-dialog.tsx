import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {FormNormalizedModelField} from '@common/ui/normalized-model/normalized-model-field';
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
import {useForm, UseFormReturn} from 'react-hook-form';

interface MergeUsersPayload {
  user_id: number | string;
  mergee_id: number | string;
}

interface Props {
  userId: number;
  userName: string;
}
export function MergeUsersDialog({userId, userName}: Props) {
  const {close, formId} = useDialogContext();
  const form = useForm<MergeUsersPayload>({
    defaultValues: {
      mergee_id: userId,
    },
  });
  const mergeUsers = useMergeUsers(form);
  const selectedUserId = form.watch('user_id');

  return (
    <Dialog>
      <DialogHeader>
        <Trans
          message="Merge ':name' into another user"
          values={{name: userName}}
        />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            mergeUsers.mutate(values, {onSuccess: () => close()});
          }}
        >
          <FormNormalizedModelField
            name="user_id"
            endpoint="normalized-models/user"
            label={<Trans message="User to merge into" />}
            placeholder={message('Select user')}
            description={
              <Trans
                message="':name' will be deleted and all data belonging to them will be merged into selected user."
                values={{name: userName}}
              />
            }
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
          disabled={!selectedUserId || mergeUsers.isPending}
        >
          <Trans message="Merge" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function useMergeUsers(form: UseFormReturn<MergeUsersPayload>) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: MergeUsersPayload) =>
      apiClient
        .post(`helpdesk/customers/merge`, payload)
        .then(response => response.data),
    onSuccess: async (r, payload) => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.customers.invalidateKey,
        }),
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.conversations.invalidateKey,
        }),
      ]);
      toast(message('Users merged'));
      navigate(`../${payload.user_id}`);
    },
    onError: r => onFormQueryError(r, form),
  });
}
