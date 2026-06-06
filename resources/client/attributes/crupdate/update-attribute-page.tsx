import {CrupdateAttributeForm} from '@app/attributes/crupdate/crupdate-attribute-form';
import {useUpdateAttribute} from '@app/attributes/crupdate/use-update-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {SectionHelper} from '@common/ui/other/section-helper';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ErrorIcon} from '@ui/icons/material/Error';
import {toast} from '@ui/toast/toast';
import {useForm} from 'react-hook-form';
import {DatatableAttribute} from '../datatable/datatable-attribute';

export function Component() {
  const {id} = useRequiredParams(['id']);
  const query = useSuspenseQuery(helpdeskQueries.attributes.get(id));

  const navigate = useNavigate();
  const form = useForm<Partial<DatatableAttribute>>({
    defaultValues: {
      name: query.data.attribute.name,
      type: query.data.attribute.type,
      description: query.data.attribute.description,
      customer_name: query.data.attribute.customer_name,
      customer_description: query.data.attribute.customer_description,
      format: query.data.attribute.format,
      required: query.data.attribute.required,
      permission: query.data.attribute.permission,
      config: {
        options: query.data.attribute.config?.options || [{}],
      },
    },
  });
  const updateAttribute = useUpdateAttribute(id, form);
  return (
    <CrupdateResourceLayout
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../.." relative="path">
            <Trans message="Attributes" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data.attribute.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      form={form}
      isLoading={updateAttribute.isPending}
      onSubmit={values => {
        updateAttribute.mutate(values, {
          onSuccess: () => {
            toast(message('Attribute updated'));
            navigate('../..', {relative: 'path'});
          },
        });
      }}
    >
      {query.data.attribute.internal && (
        <SectionHelper
          color="neutral"
          className="mb-24"
          leadingIcon={<ErrorIcon size="xs" className="text-danger" />}
          title={
            <Trans message="This is a system attribute. Type, format and permissions can't be edited." />
          }
        />
      )}
      <CrupdateAttributeForm
        isUpdating
        isInternal={query.data.attribute.internal}
        attributeKey={query.data.attribute.key}
      />
    </CrupdateResourceLayout>
  );
}
