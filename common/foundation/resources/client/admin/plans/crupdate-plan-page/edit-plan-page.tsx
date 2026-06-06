import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {CrupdateResourceLayout} from '../../crupdate-resource-layout';
import {
  UpdateProductPayload,
  useUpdateProduct,
} from '../requests/use-update-product';
import {CrupdatePlanForm} from './crupdate-plan-form';

export function Component() {
  const {productId} = useRequiredParams(['productId']);
  const query = useSuspenseQuery(commonAdminQueries.products.get(productId));

  const form = useForm<UpdateProductPayload>({
    defaultValues: {
      ...query.data.product,
      feature_list: query.data.product.feature_list.map(f => ({value: f})),
    },
  });
  const updateProduct = useUpdateProduct(form);

  return (
    <CrupdateResourceLayout
      form={form}
      onSubmit={values => {
        updateProduct.mutate(values);
      }}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="/admin/plans">
            <Trans message="Plans" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data.product.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={updateProduct.isPending}
    >
      <CrupdatePlanForm />
    </CrupdateResourceLayout>
  );
}
