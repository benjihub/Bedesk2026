import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateAttributeForm} from '@app/attributes/crupdate/crupdate-attribute-form';
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
import {DatatableAttribute} from '../datatable/datatable-attribute';

export function Component() {
  const form = useForm<Partial<DatatableAttribute>>({
    defaultValues: {
      type: 'conversation',
      format: 'text',
      required: false,
      permission: 'userCanEdit',
      config: {
        options: [{}],
      },
    },
  });
  const createAttribute = useCreateAttribute(form);
  return (
    <CrupdateResourceLayout
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to=".." relative="path">
            <Trans message="Attributes" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="Create" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      form={form}
      isLoading={createAttribute.isPending}
      onSubmit={values => {
        createAttribute.mutate(values);
      }}
    >
      <CrupdateAttributeForm />
    </CrupdateResourceLayout>
  );
}

function useCreateAttribute(form: UseFormReturn<Partial<DatatableAttribute>>) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: Partial<DatatableAttribute>) =>
      apiClient.post('helpdesk/attributes', payload),
    onSuccess: () => {
      toast(message('Custom attribute created'));
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.attributes.invalidateKey,
      });
      navigate('..', {relative: 'path'});
    },
    onError: err => onFormQueryError(err, form),
  });
}
