import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {CrupdateResourceLayout} from '../../crupdate-resource-layout';
import {
  CreateProductPayload,
  useCreateProduct,
} from '../requests/use-create-product';
import {CrupdatePlanForm} from './crupdate-plan-form';

export function Component() {
  const form = useForm<CreateProductPayload>({
    defaultValues: {
      free: false,
      recommended: false,
    },
  });
  const createProduct = useCreateProduct(form);

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={values => {
        createProduct.mutate(values);
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/admin/plans">
            <Trans message="Plans" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New plan" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createProduct.isPending}
    >
      <CrupdatePlanForm />
    </CrupdateResourceLayout>
  );
}
