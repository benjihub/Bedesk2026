import {adminQueries} from '@app/admin/admin-queries';
import {CrupdateTriggerForm} from '@app/triggers/form/crupdate-trigger-form';
import {
  CreateTriggerPayload,
  useCreateTrigger,
} from '@app/triggers/requests/use-create-trigger';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {StaticPageTitle} from '@common/seo/static-page-title';

export function Component() {
  const configQuery = useSuspenseQuery(adminQueries.triggers.config());
  const form = useForm<CreateTriggerPayload>();
  const createTrigger = useCreateTrigger(form);

  return (
    <CrupdateResourceLayout
      onSubmit={values => createTrigger.mutate(values)}
      form={form}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../triggers">
            <Trans message="Triggers" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Trans message="New" />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={createTrigger.isPending}
      wrapInContainer
    >
      <StaticPageTitle>
        <Trans message="New trigger" />
      </StaticPageTitle>
      <CrupdateTriggerForm config={configQuery.data} />
    </CrupdateResourceLayout>
  );
}
