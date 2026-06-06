import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateViewForm} from '@app/dashboard/views/form/crupdate-view-form';
import {View} from '@app/dashboard/views/view';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {useForm, UseFormReturn} from 'react-hook-form';

export function Component() {
  const navigate = useNavigate();
  const form = useForm<Partial<View>>({
    defaultValues: {
      access: 'anyone',
      pinned: false,
      conditions: [],
      order_by: 'id',
      order_dir: 'desc',
    },
  });

  const createView = useCreateView(form);

  const handleSubmit = (value: Partial<View>) => {
    createView.mutate(value, {
      onSuccess: () => {
        navigate('..');
      },
    });
  };

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={handleSubmit}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="..">
            <Trans message="Views" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="Create view" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createView.isPending}
      disableSaveWhenNotDirty
    >
      <CrupdateViewForm />
    </CrupdateResourceLayout>
  );
}

function useCreateView(form: UseFormReturn<Partial<View>>) {
  return useMutation({
    mutationFn: (payload: Partial<View>) =>
      apiClient.post<Response>(`helpdesk/views`, payload).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      });
      toast(message('View created'));
    },
    onError: err => onFormQueryError(err, form),
  });
}
