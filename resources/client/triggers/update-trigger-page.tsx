import {adminQueries} from '@app/admin/admin-queries';
import {CrupdateTriggerForm} from '@app/triggers/form/crupdate-trigger-form';
import {
  UpdateTriggerPayload,
  useUpdateTrigger,
} from '@app/triggers/requests/use-update-trigger';
import {CrupdateResourceLayout} from '@common/admin/crupdate-resource-layout';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {StaticPageTitle} from '@common/seo/static-page-title';

export function Component() {
  const {triggerId} = useRequiredParams(['triggerId']);
  const query = useSuspenseQuery(adminQueries.triggers.get(triggerId));
  const configQuery = useSuspenseQuery(adminQueries.triggers.config());

  const form = useForm<UpdateTriggerPayload>({
    defaultValues: {
      name: query.data.trigger.name,
      description: query.data.trigger.description,
      conditions: query.data.trigger.config.conditions,
      actions: query.data.trigger.config.actions,
    },
  });

  const updateTrigger = useUpdateTrigger(form);
  return (
    <CrupdateResourceLayout
      onSubmit={values => updateTrigger.mutate(values)}
      form={form}
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../triggers">
            <Trans message="Triggers" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data.trigger.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={updateTrigger.isPending}
      wrapInContainer
    >
      <StaticPageTitle>
        <Trans message="Edit trigger" />
      </StaticPageTitle>
      <CrupdateTriggerForm config={configQuery.data} />
    </CrupdateResourceLayout>
  );
}
