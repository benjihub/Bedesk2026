import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {CrupdateViewForm} from '@app/dashboard/views/form/crupdate-view-form';
import {useUpdateView} from '@app/dashboard/views/use-update-view';
import {View} from '@app/dashboard/views/view';
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

export function Component() {
  const {viewId} = useRequiredParams(['viewId']);
  const query = useSuspenseQuery(helpdeskQueries.views.get(viewId));

  const navigate = useNavigate();
  const form = useForm<Partial<View>>({
    defaultValues: {
      name: query.data.view.name,
      icon: query.data.view.icon,
      access: query.data.view.access,
      pinned: query.data.view.pinned,
      conditions: query.data.view.conditions,
      columns: query.data.view.columns,
      description: query.data.view.description,
      group_by: query.data.view.group_by,
      order_by: query.data.view.order_by,
      order_dir: query.data.view.order_dir,
    },
  });

  const updateView = useUpdateView(viewId, form);

  const handleSubmit = (value: Partial<View>) => {
    updateView.mutate(value, {
      onSuccess: () => {
        toast(message('View updated'));
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
          <BreadcrumbItem>{query.data.view.name}</BreadcrumbItem>
        </Breadcrumb>
      }
      isLoading={updateView.isPending}
      disableSaveWhenNotDirty
    >
      {query.data.view.internal && (
        <SectionHelper
          color="neutral"
          className="mb-24"
          leadingIcon={<ErrorIcon size="xs" className="text-danger" />}
          title={
            <Trans message="This is a system view. Access and conditions for it can't be edited." />
          }
        />
      )}
      <CrupdateViewForm isInternal={query.data.view.internal} />
    </CrupdateResourceLayout>
  );
}
